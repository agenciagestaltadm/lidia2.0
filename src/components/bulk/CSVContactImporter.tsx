"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Check } from "lucide-react";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { CSVContact } from "@/types/campaigns";
import { parseCSVPhone, isValidWhatsAppNumber } from "@/lib/phone-normalization";
import { cn } from "@/lib/utils";

interface CSVContactImporterProps {
  onImport: (contacts: CSVContact[]) => void;
  importedData?: CSVContact[];
}

export function CSVContactImporter({ onImport, importedData }: CSVContactImporterProps) {
  const [contacts, setContacts] = useState<CSVContact[]>(importedData || []);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSV = useCallback((content: string) => {
    setIsProcessing(true);
    setErrors([]);
    
    const lines = content.split('\n').filter(line => line.trim());
    const parsed: CSVContact[] = [];
    const parseErrors: string[] = [];

    lines.forEach((line, index) => {
      // Skip header if it contains non-numeric characters in phone position
      if (index === 0) {
        const parts = line.split(',');
        if (parts.length >= 2 && !/\d/.test(parts[1])) {
          return; // Skip header
        }
      }

      const result = parseCSVPhone(line);
      
      if (isValidWhatsAppNumber(result.normalized)) {
        parsed.push({
          name: result.name || `Contato ${parsed.length + 1}`,
          phone: result.normalized,
        });
      } else {
        parseErrors.push(`Linha ${index + 1}: ${result.phone} - número inválido`);
      }
    });

    setContacts(parsed);
    setErrors(parseErrors);
    onImport(parsed);
    setIsProcessing(false);
  }, [onImport]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCSV(content);
    };
    reader.readAsText(file);
  }, [processCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processCSV(content);
    };
    reader.readAsText(file);
  }, [processCSV]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const clearData = () => {
    setContacts([]);
    setErrors([]);
    onImport([]);
  };

  if (contacts.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="dark:text-white text-slate-900 font-medium">
                {contacts.length} contatos importados
              </p>
              <p className="text-sm dark:text-slate-400 text-slate-500">
                Pronto para envio
              </p>
            </div>
          </div>
          <button
            onClick={clearData}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {errors.length} linhas com erro
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto text-xs text-red-300 space-y-1">
              {errors.slice(0, 5).map((error, i) => (
                <p key={i}>{error}</p>
              ))}
              {errors.length > 5 && (
                <p>... e mais {errors.length - 5} erros</p>
              )}
            </div>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto space-y-2">
          {contacts.slice(0, 10).map((contact, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg dark:bg-white/5 bg-slate-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <div className="flex-1 min-w-0">
                <p className="dark:text-white text-slate-900 text-sm truncate">
                  {contact.name}
                </p>
                <p className="text-xs dark:text-slate-400 text-slate-500">
                  {contact.phone}
                </p>
              </div>
            </div>
          ))}
          {contacts.length > 10 && (
            <p className="text-center text-sm dark:text-slate-400 text-slate-500 py-2">
              ... e mais {contacts.length - 10} contatos
            </p>
          )}
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-4 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "dark:border-white/20 border-slate-300 dark:hover:border-white/40 hover:border-slate-400"
          )}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-6 h-6 mx-auto mb-2 dark:text-slate-400 text-slate-500" />
          <p className="text-sm dark:text-slate-300 text-slate-600">
            Arraste outro arquivo ou clique para substituir
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "p-8 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-emerald-500 bg-emerald-500/10"
            : "dark:border-white/20 border-slate-300 dark:hover:border-white/40 hover:border-slate-400"
        )}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="w-10 h-10 mx-auto mb-3 dark:text-slate-400 text-slate-500" />
        <p className="dark:text-white text-slate-900 font-medium mb-1">
          {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo CSV"}
        </p>
        <p className="text-sm dark:text-slate-400 text-slate-500 mb-3">
          ou clique para selecionar
        </p>
        <GlowBadge variant="default">
          <FileSpreadsheet className="w-3 h-3 mr-1" />
          CSV apenas
        </GlowBadge>
      </div>

      <div className="p-4 rounded-lg dark:bg-white/5 bg-slate-50">
        <p className="text-sm dark:text-slate-300 text-slate-700 font-medium mb-2">
          Formato esperado:
        </p>
        <code className="text-xs dark:text-slate-400 text-slate-500 block">
          Nome,Telefone<br />
          João Silva,11999999999<br />
          Maria Santos,11888888888
        </code>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 dark:text-slate-400 text-slate-500">
            Processando...
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Erros encontrados
            </span>
          </div>
          <div className="text-xs text-red-300 space-y-1">
            {errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
