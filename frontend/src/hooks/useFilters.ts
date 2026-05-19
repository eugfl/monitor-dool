import { useState, useCallback } from 'react';

export interface FilterState {
  q: string;
  orgao: string;
  tipo: string;
  dateMode: 'single' | 'range';
  data_inicio: string;
  data_fim: string;
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    orgao: 'all',
    tipo: 'all',
    dateMode: 'single',
    data_inicio: '',
    data_fim: '',
  });

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'dateMode' && value === 'single' ? { data_fim: '' } : {}),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      q: '',
      orgao: 'all',
      tipo: 'all',
      dateMode: 'single',
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
