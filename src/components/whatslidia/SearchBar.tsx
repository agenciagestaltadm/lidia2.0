'use client';

import React, { useState, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useWhatsAppSearch } from '@/hooks/use-whatsapp-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  sessionId: string;
  isDarkMode?: boolean;
  onSearch?: (query: string, filters: any) => void;
  placeholder?: string;
}

export function SearchBar({
  sessionId,
  isDarkMode = false,
  onSearch,
  placeholder = 'Buscar mensagens...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    from: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    hasReactions: undefined as boolean | undefined,
    isDeleted: false,
    isForwarded: false,
  });

  const { searchMessages, results, loading } = useWhatsAppSearch(sessionId);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    await searchMessages(query, filters);
    onSearch?.(query, filters);
  }, [query, filters, searchMessages, onSearch]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      from: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      hasReactions: undefined,
      isDeleted: false,
      isForwarded: false,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setFilters({
      from: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      hasReactions: undefined,
      isDeleted: false,
      isForwarded: false,
    });
  }, []);

  const hasActiveFilters =
    filters.from ||
    filters.type ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.hasReactions !== undefined ||
    filters.isDeleted ||
    filters.isForwarded;

  return (
    <div
      className={`w-full space-y-3 p-4 rounded-lg border ${
        isDarkMode
          ? 'bg-slate-900 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`pl-10 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-white border-slate-300'
            }`}
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={`${
            hasActiveFilters
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : isDarkMode
              ? 'bg-slate-800 border-slate-600 text-slate-300'
              : 'bg-white border-slate-300'
          }`}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded border ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* From Filter */}
          <div>
            <label
              className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              De:
            </label>
            <Input
              type="text"
              placeholder="Número"
              value={filters.from}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value })
              }
              className={`mt-1 text-sm ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300'
              }`}
            />
          </div>

          {/* Type Filter */}
          <div>
            <label
              className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Tipo:
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value })
              }
              className={`mt-1 w-full text-sm rounded border px-2 py-1 ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300'
              }`}
            >
              <option value="">Todos</option>
              <option value="message">Mensagem</option>
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
              <option value="audio">Áudio</option>
              <option value="document">Documento</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              De:
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              className={`mt-1 text-sm ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300'
              }`}
            />
          </div>

          {/* Date To */}
          <div>
            <label
              className={`text-xs font-medium ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Até:
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              className={`mt-1 text-sm ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300'
              }`}
            />
          </div>

          {/* Checkboxes */}
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasReactions === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    hasReactions: e.target.checked ? true : undefined,
                  })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Com reações
              </span>
            </label>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isDeleted}
                onChange={(e) =>
                  setFilters({ ...filters, isDeleted: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Deletadas
              </span>
            </label>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isForwarded}
                onChange={(e) =>
                  setFilters({ ...filters, isForwarded: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Encaminhadas
              </span>
            </label>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Limpar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {query && (
        <div
          className={`text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {results.length} resultado(s) encontrado(s)
        </div>
      )}
    </div>
  );
}
