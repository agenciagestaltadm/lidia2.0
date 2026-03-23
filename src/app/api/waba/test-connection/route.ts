import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MetaGraphAPI } from '@/lib/meta-api';

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

    // Parse request body
    const body = await request.json();
    const { phone_number_id, business_account_id, access_token } = body;

    if (!phone_number_id || !access_token) {
      return NextResponse.json(
        { success: false, error: 'Phone Number ID and Access Token are required' },
        { status: 400 }
      );
    }

    // Test connection with Meta API
    const metaApi = new MetaGraphAPI({
      accessToken: access_token,
      phoneNumberId: phone_number_id,
      businessAccountId: business_account_id,
    });

    const result = await metaApi.testConnection();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing WABA connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
