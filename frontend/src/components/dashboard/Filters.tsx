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
}

export function Filters({ 
  filters, 
  updateFilter, 
  resetFilters, 
  onApply,
  availableOrgaos = [],
  availableTipos = []
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasActiveFilters = filters.q !== '' || filters.orgao !== 'all' || filters.tipo !== 'all';

  return (
    <div className="w-full bg-card border rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center">
        {/* Search Bar */}
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
          >
            Buscar
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
              {/* Orgao Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Órgão / Secretaria</label>
                <Select value={filters.orgao} onValueChange={(v) => updateFilter('orgao', v)}>
                  <SelectTrigger className="h-10 bg-card">
                    <SelectValue placeholder="Todos os órgãos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os órgãos</SelectItem>
                    {availableOrgaos.map(orgao => (
                      <SelectItem key={orgao} value={orgao}>{orgao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo de Matéria</label>
                <Select value={filters.tipo} onValueChange={(v) => updateFilter('tipo', v)}>
                  <SelectTrigger className="h-10 bg-card">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {availableTipos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter (Simplified for now) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Período</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-10 gap-2 border-muted-foreground/20 text-xs">
                    <Calendar className="w-3 h-3" />
                    Últimos 7 dias
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-muted/10 border-t flex justify-end gap-3">
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
