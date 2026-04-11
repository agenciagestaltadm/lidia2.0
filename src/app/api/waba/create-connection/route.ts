import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CreateConnectionRequest {
  company_id: string;
  name: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  api_version?: string;
}

function generateVerifyToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function buildWebhookUrl(accountUuid: string): string {
  // Extract project ref from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || "";

  if (!projectRef && supabaseUrl) {
    try {
      const hostname = new URL(supabaseUrl).hostname;
      const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
      if (match) {
        projectRef = match[1];
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  if (projectRef) {
    return `https://${projectRef}.supabase.co/functions/v1/whatsapp-webhook/${accountUuid}`;
  }

  // Fallback
  return `https://mnesrdqzowtasvyqsjjn.supabase.co/functions/v1/whatsapp-webhook/${accountUuid}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateConnectionRequest = await request.json();
    const { company_id, name, phone_number_id, business_account_id, access_token, api_version } = body;

    // Validate required fields
    if (!company_id || !name || !phone_number_id || !business_account_id || !access_token) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando: company_id, name, phone_number_id, business_account_id, access_token" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      console.error("[create-connection] Auth error:", authError);
      return NextResponse.json(
        { error: "Usuário não autenticado. Faça login novamente." },
        { status: 401 }
      );
    }

    console.log("[create-connection] Auth user:", authUser.id, "Company:", company_id);

    // Verify user belongs to the company they're creating a connection for
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, company_id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("[create-connection] Profile lookup error:", profileError);
    }

    // Check if user is super_user or belongs to the same company
    const { data: superUser } = await supabase
      .from("super_users")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!superUser && profile?.company_id !== company_id) {
      console.error("[create-connection] User company mismatch:", {
        userCompany: profile?.company_id,
        requestedCompany: company_id
      });
      return NextResponse.json(
        { error: "Você não tem permissão para criar conexões nesta empresa." },
        { status: 403 }
      );
    }

    // Generate connection data
    const accountUuid = crypto.randomUUID();
    const verifyToken = generateVerifyToken();
    const webhookUrl = buildWebhookUrl(accountUuid);

    console.log("[create-connection] Creating connection:", {
      accountUuid,
      webhookUrl,
      companyId: company_id
    });

    // Insert into waba_configs
    const { data: connection, error: insertError } = await supabase
      .from("waba_configs")
      .insert({
        company_id,
        name,
        phone_number_id,
        business_account_id,
        access_token,
        api_version: api_version || "v18.0",
        account_uuid: accountUuid,
        webhook_url: webhookUrl,
        webhook_verify_token: verifyToken,
        verify_token: verifyToken,
        created_by: authUser.id, // auth.users(id) - correct FK reference
        status: "pending"
      })
      .select()
      .single();

    if (insertError) {
      console.error("[create-connection] Insert error:", JSON.stringify({
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, null, 2));
      
      // Return specific error messages for common issues
      if (insertError.code === "23503") {
        return NextResponse.json(
          { error: "Erro de referência no banco de dados. O usuário não foi encontrado na tabela de autenticação." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: insertError.message || "Erro ao criar conexão no banco de dados" },
        { status: 500 }
      );
    }

    if (!connection) {
      console.error("[create-connection] Insert returned no data - possible RLS SELECT issue");
      return NextResponse.json(
        { error: "Conexão criada mas não foi possível ler os dados de volta. Verifique as políticas RLS." },
        { status: 500 }
      );
    }

    console.log("[create-connection] Connection created successfully:", connection.id);

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        webhookUrl,
        verifyToken
      }
    });

  } catch (error) {
    console.error("[create-connection] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
