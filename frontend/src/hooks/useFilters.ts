import { useState, useCallback } from 'react';

export interface FilterState {
  q: string;
  orgao: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    orgao: 'all',
    tipo: 'all',
    data_inicio: '',
    data_fim: '',
  });

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      q: '',
      orgao: 'all',
      tipo: 'all',
      data_inicio: '',
      data_fim: '',
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
