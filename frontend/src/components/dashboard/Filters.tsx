import React from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/select';
import { motion, AnimatePresence } from 'framer-motion';
import type { FilterState } from '@/hooks/useFilters';

interface FiltersProps {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  onApply: () => void;
  availableOrgaos?: string[];
  availableTipos?: string[];
  isLoading?: boolean;
}

export function Filters({
  filters,
  updateFilter,
  resetFilters,
  onApply,
  availableOrgaos = [],
  availableTipos = [],
  isLoading = false,
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasActiveFilters = filters.q !== '' || filters.orgao !== 'all' || filters.tipo !== 'all' || filters.data_inicio !== '' || filters.data_fim !== '';
  const isRangeMode = filters.dateMode === 'range';

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Pesquisar por palavras-chave, nomes ou decretos..."
            className="pl-10 h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="flex-1 md:flex-none h-11 gap-2 border-muted-foreground/20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Button>

          <Button
            className="flex-1 md:flex-none h-11 px-8 font-bold"
            onClick={onApply}
            disabled={isLoading}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-muted/5 overflow-hidden"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Órgão / Secretaria</label>
                <Select value={filters.orgao} onValueChange={(v) => updateFilter('orgao', v)}>
                  <SelectTrigger className="h-10 bg-card">
                    <SelectValue placeholder="Todos os órgãos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os órgãos</SelectItem>
                    {availableOrgaos.map((orgao) => (
                      <SelectItem key={orgao} value={orgao}>{orgao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo de Matéria</label>
                <Select value={filters.tipo} onValueChange={(v) => updateFilter('tipo', v)}>
                  <SelectTrigger className="h-10 bg-card">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {availableTipos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data de publicação</label>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_1fr] gap-3 items-center">
                  <Select value={filters.dateMode} onValueChange={(v) => updateFilter('dateMode', v)}>
                    <SelectTrigger className="h-10 bg-card">
                      <SelectValue placeholder="Tipo de busca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Buscar uma edição</SelectItem>
                      <SelectItem value="range">Buscar mais de uma edição</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      className="w-full h-10 pl-8 pr-2 bg-card border border-input rounded-md text-xs focus:ring-1 focus:ring-primary outline-none"
                      value={filters.data_inicio}
                      onChange={(e) => updateFilter('data_inicio', e.target.value)}
                    />
                  </div>

                  {isRangeMode && (
                    <div className="relative">
                      <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="date"
                        className="w-full h-10 pl-8 pr-2 bg-card border border-input rounded-md text-xs focus:ring-1 focus:ring-primary outline-none"
                        value={filters.data_fim}
                        onChange={(e) => updateFilter('data_fim', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isRangeMode ? 'Selecione a data inicial e final do período.' : 'Selecione uma data específica do Diário Oficial.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-muted/10 border-t flex justify-between items-center gap-3">
              <p className="text-[10px] text-muted-foreground italic">
                * Caso a edição não exista no sistema, você poderá solicitar a coleta na busca.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold h-8 text-muted-foreground hover:text-destructive transition-colors"
                onClick={resetFilters}
              >
                <X className="w-3 h-3 mr-1" />
                Limpar Filtros
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
