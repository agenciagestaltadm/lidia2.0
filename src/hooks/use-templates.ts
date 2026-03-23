"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WABATemplate, TemplateCreateData } from "@/types/waba";
import { toast } from "sonner";

// Query keys
export const templateKeys = {
  all: ["waba", "templates"] as const,
  list: (configId?: string) => [...templateKeys.all, "list", configId] as const,
  detail: (id: string) => [...templateKeys.all, "detail", id] as const,
};

// Fetch templates for a WABA config
async function fetchTemplates(configId?: string): Promise<WABATemplate[]> {
  if (!configId) return [];
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_templates")
    .select("*")
    .eq("waba_config_id", configId)
    .eq("status", "APPROVED")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as WABATemplate[]) || [];
}

// Fetch single template
async function fetchTemplate(templateId: string): Promise<WABATemplate | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) throw error;
  return data as WABATemplate | null;
}

// Create template via API
async function createTemplate(
  configId: string,
  templateData: TemplateCreateData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const response = await fetch(`/api/waba/templates?configId=${configId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templateData),
  });

  return response.json();
}

// Delete template
async function deleteTemplate(
  configId: string,
  templateName: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/waba/templates?configId=${configId}&name=${encodeURIComponent(templateName)}`, {
    method: 'DELETE',
  });

  return response.json();
}

// Check template status
async function checkTemplateStatus(
  templateId: string
): Promise<{ status: string; updated: boolean }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_templates")
    .select("status")
    .eq("id", templateId)
    .single();

  if (error) throw error;
  return { status: data?.status || 'UNKNOWN', updated: true };
}

// Extract variables from template
export function extractTemplateVariables(template: WABATemplate): Array<{
  name: string;
  type: string;
  example?: string;
  required: boolean;
}> {
  const variables: Array<{
    name: string;
    type: string;
    example?: string;
    required: boolean;
  }> = [];

  if (!template.components) return variables;

  for (const component of template.components) {
    if (component.text) {
      // Find {{variable}} patterns
      const matches = component.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach((match, index) => {
          const varName = match.replace(/[{}]/g, '');
          if (!variables.find(v => v.name === varName)) {
            variables.push({
              name: varName,
              type: 'text',
              example: component.example?.header_text?.[0] || '',
              required: true,
            });
          }
        });
      }
    }

    // Check for example values in the component
    if (component.example) {
      const exampleBody = component.example.body_text;
      if (exampleBody && Array.isArray(exampleBody)) {
        exampleBody.forEach((examples, compIndex) => {
          if (Array.isArray(examples)) {
            examples.forEach((example, varIndex) => {
              const varName = `${compIndex + 1}`;
              const existingVar = variables.find(v => v.name === varName);
              if (existingVar) {
                existingVar.example = example;
              }
            });
          }
        });
      }
    }
  }

  return variables;
}

// Build template components with variable values
export function buildTemplateComponentsWithVariables(
  template: WABATemplate,
  variableValues: Record<string, string>
): unknown[] {
  return template.components.map((component) => {
    const comp = { ...component };
    
    if (comp.text && typeof comp.text === 'string') {
      let text = comp.text;
      // Replace {{variable}} with actual values
      Object.entries(variableValues).forEach(([key, value]) => {
        text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });
      comp.text = text;
    }
    
    return comp;
  });
}

// Hooks

export function useTemplates(configId?: string) {
  return useQuery({
    queryKey: templateKeys.list(configId),
    queryFn: () => fetchTemplates(configId),
    enabled: !!configId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: () => fetchTemplate(templateId),
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: TemplateCreateData }) =>
      createTemplate(configId, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: templateKeys.list(variables.configId) 
        });
        toast.success("Template criado e enviado para aprovação!");
      } else {
        toast.error(result.error || "Erro ao criar template");
      }
    },
    onError: (error: Error) => {
      console.error("Error creating template:", error);
      toast.error("Erro ao criar template");
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configId, templateName }: { configId: string; templateName: string }) =>
      deleteTemplate(configId, templateName),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: templateKeys.list(variables.configId) 
        });
        toast.success("Template removido com sucesso!");
      } else {
        toast.error(result.error || "Erro ao remover template");
      }
    },
    onError: (error: Error) => {
      console.error("Error deleting template:", error);
      toast.error("Erro ao remover template");
    },
  });
}

export function useCheckTemplateStatus() {
  return useMutation({
    mutationFn: checkTemplateStatus,
  });
}
