import React from 'react';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/select';
import type { FilterState } from '@/hooks/useFilters';
import type { FilterOption } from '@/types';

interface FiltersProps {
  filters: FilterState;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  onApply: () => void;
  availableTipos?: FilterOption[];
  isLoading?: boolean;
}

export function Filters({
  filters,
  updateFilter,
  resetFilters,
  onApply,
  availableTipos = [],
  isLoading = false,
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasActiveFilters = filters.q !== '' || filters.tipo !== 'all' || filters.data_inicio !== '' || filters.data_fim !== '';
  const isRangeMode = filters.dateMode === 'range';

  return (
    <div className="mb-6 w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="group relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Pesquisar por órgão, pessoa, empresa, decreto..."
            className="h-11 bg-muted/30 pl-10"
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 gap-2 md:h-10 md:flex-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
          </Button>

          <Button type="button" className="h-11 flex-1 px-6 font-bold md:h-10 md:flex-none" onClick={onApply} disabled={isLoading}>
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
            className="overflow-hidden border-t bg-muted/5"
          >
            <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-[220px_220px_1fr_auto] md:items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Select value={filters.tipo} onValueChange={(v) => updateFilter('tipo', v)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {availableTipos.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Período</label>
                <Select value={filters.dateMode} onValueChange={(v) => updateFilter('dateMode', v)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Tipo de busca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Uma edição</SelectItem>
                    <SelectItem value="range">Mais de uma edição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DateInput value={filters.data_inicio} onChange={(value) => updateFilter('data_inicio', value)} />
                {isRangeMode && (
                  <DateInput value={filters.data_fim} onChange={(value) => updateFilter('data_fim', value)} />
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-11 justify-center text-xs font-bold text-muted-foreground hover:text-destructive md:h-10"
                onClick={(event) => {
                  event.preventDefault();
                  resetFilters();
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Limpar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="date"
        className="h-11 w-full rounded-md border border-input bg-card pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-primary md:h-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
