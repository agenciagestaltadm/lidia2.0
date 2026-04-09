import { NextRequest, NextResponse } from "next/server";

interface TestConnectionRequest {
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  api_version: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestConnectionRequest = await request.json();
    const { phone_number_id, access_token, api_version } = body;

    // Validate required fields
    if (!phone_number_id || !access_token || !api_version) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Campos obrigatórios faltando: phone_number_id, access_token, api_version" 
        },
        { status: 400 }
      );
    }

    // Test connection by calling Meta API
    const apiUrl = `https://graph.facebook.com/${api_version}/${phone_number_id}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Erro HTTP ${response.status}`;
      
      // Handle specific error codes
      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Token de acesso inválido ou expirado. Verifique seu token no Gerenciador de Negócios." 
          },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            error: "ID do número de telefone não encontrado. Verifique se o ID está correto." 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate that we got the expected data
    if (!data.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Resposta inválida da API da Meta" 
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "Conexão estabelecida com sucesso!",
      data: {
        phone_number_id: data.id,
        display_phone_number: data.display_phone_number,
        quality_rating: data.quality_rating,
        verified_name: data.verified_name
      }
    });

  } catch (error) {
    console.error("Error testing WABA connection:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno ao testar conexão. Tente novamente mais tarde." 
      },
      { status: 500 }
    );
  }
}
