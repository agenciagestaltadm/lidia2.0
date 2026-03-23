import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MetaGraphAPI } from '@/lib/meta-api';
import type { TemplateCreateData } from '@/types/waba';

// GET - List templates or sync from Meta
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Get WABA config
    const { data: config, error: configError } = await supabase
      .from('waba_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { success: false, error: 'WABA config not found' },
        { status: 404 }
      );
    }

    // Sync templates from Meta API
    const metaApi = new MetaGraphAPI({
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      businessAccountId: config.business_account_id,
    });

    const result = await metaApi.getTemplates();

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Store templates in database using the sync function
    const { error: syncError } = await supabase.rpc('sync_waba_templates', {
      p_waba_config_id: configId,
      p_templates: result.templates || [],
    });

    if (syncError) {
      console.error('Error syncing templates:', syncError);
    }

    // Return templates from database
    const { data: templates, error: templatesError } = await supabase
      .from('waba_templates')
      .select('*')
      .eq('waba_config_id', configId)
      .eq('status', 'APPROVED')
      .order('name', { ascending: true });

    if (templatesError) {
      return NextResponse.json(
        { success: false, error: templatesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      synced_count: result.templates?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // Get WABA config
    const { data: config, error: configError } = await supabase
      .from('waba_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { success: false, error: 'WABA config not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: TemplateCreateData = await request.json();

    if (!body.name || !body.category || !body.language || !body.components) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create template via Meta API
    const metaApi = new MetaGraphAPI({
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      businessAccountId: config.business_account_id,
    });

    const result = await metaApi.createTemplate(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    const templateName = searchParams.get('name');

    if (!configId || !templateName) {
      return NextResponse.json(
        { success: false, error: 'Config ID and template name are required' },
        { status: 400 }
      );
    }

    // Get WABA config
    const { data: config, error: configError } = await supabase
      .from('waba_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { success: false, error: 'WABA config not found' },
        { status: 404 }
      );
    }

    // Delete template via Meta API
    const metaApi = new MetaGraphAPI({
      accessToken: config.access_token,
      phoneNumberId: config.phone_number_id,
      businessAccountId: config.business_account_id,
    });

    const result = await metaApi.deleteTemplate(templateName);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Also remove from local database
    await supabase
      .from('waba_templates')
      .delete()
      .eq('waba_config_id', configId)
      .eq('name', templateName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
