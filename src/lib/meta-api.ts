// Meta Graph API integration for WhatsApp Business API

import type { 
  WABATemplate, 
  TemplateCreateData, 
  WABAMessageResponse,
  MetaAPIResponse 
} from '@/types/waba';

const META_GRAPH_API_VERSION = 'v18.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export interface MetaAPIConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

export class MetaGraphAPI {
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId?: string;
  private baseUrl: string;

  constructor(config: MetaAPIConfig) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.businessAccountId = config.businessAccountId;
    this.baseUrl = META_GRAPH_BASE_URL;
  }

  /**
   * Test connection to Meta API
   */
  async testConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Try to get phone number details
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}?access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to connect to Meta API'
        };
      }

      return {
        success: true,
        message: `Connected successfully. Phone number: ${data.display_phone_number}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all templates for the business account
   */
  async getTemplates(): Promise<{ success: boolean; templates?: WABATemplate[]; error?: string }> {
    try {
      if (!this.businessAccountId) {
        return {
          success: false,
          error: 'Business Account ID is required to fetch templates'
        };
      }

      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates?access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to fetch templates'
        };
      }

      return {
        success: true,
        templates: data.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new message template
   */
  async createTemplate(templateData: TemplateCreateData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!this.businessAccountId) {
        return {
          success: false,
          error: 'Business Account ID is required to create templates'
        };
      }

      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: templateData.name,
            category: templateData.category,
            language: templateData.language,
            components: templateData.components,
            access_token: this.accessToken
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to create template'
        };
      }

      return {
        success: true,
        id: data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a message template
   */
  async deleteTemplate(templateName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.businessAccountId) {
        return {
          success: false,
          error: 'Business Account ID is required'
        };
      }

      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: templateName,
            access_token: this.accessToken
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to delete template'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'pt_BR',
    components?: unknown[]
  ): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
    try {
      const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      if (components && components.length > 0) {
        (payload.template as Record<string, unknown>).components = components;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
          errorCode: data.error?.code
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(
    to: string,
    text: string,
    previewUrl: boolean = false
  ): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: {
              preview_url: previewUrl,
              body: text
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to send message',
          errorCode: data.error?.code
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${messageId}?access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to get message status'
        };
      }

      return {
        success: true,
        status: data.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get business profile
   */
  async getBusinessProfile(): Promise<{ success: boolean; profile?: unknown; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}/whatsapp_business_profile?access_token=${this.accessToken}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Failed to get business profile'
        };
      }

      return {
        success: true,
        profile: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse template components for variables
   */
  static parseTemplateVariables(components: unknown[]): Array<{ type: string; example?: string }> {
    const variables: Array<{ type: string; example?: string }> = [];
    
    for (const component of components) {
      const comp = component as Record<string, unknown>;
      if (comp.text && typeof comp.text === 'string') {
        // Find all {{variable}} patterns
        const matches = comp.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const index = parseInt(match.replace(/[{}]/g, '')) - 1;
            if (!variables[index]) {
              variables[index] = { type: 'text' };
            }
          });
        }
      }
    }
    
    return variables;
  }

  /**
   * Build template components with variables
   */
  static buildTemplateComponents(
    templateComponents: unknown[],
    variables: Record<string, string>
  ): unknown[] {
    return templateComponents.map((component) => {
      const comp = component as Record<string, unknown>;
      
      if (comp.text && typeof comp.text === 'string') {
        let text = comp.text;
        // Replace {{variable}} with actual values
        Object.entries(variables).forEach(([key, value]) => {
          text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        
        return {
          ...comp,
          text
        };
      }
      
      return comp;
    });
  }
}

/**
 * Create Meta API client from config
 */
export function createMetaAPIClient(
  accessToken: string,
  phoneNumberId: string,
  businessAccountId?: string
): MetaGraphAPI {
  return new MetaGraphAPI({
    accessToken,
    phoneNumberId,
    businessAccountId
  });
}
