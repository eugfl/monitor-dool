import { useCallback, useState } from 'react';

export interface FilterState {
  q: string;
  tipo: string;
  dateMode: 'single' | 'range';
  data_inicio: string;
  data_fim: string;
}

export const defaultFilters: FilterState = {
  q: '',
  tipo: 'all',
  dateMode: 'single',
  data_inicio: '',
  data_fim: '',
};

export function useFilters(initialFilters: FilterState = defaultFilters) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'dateMode' && value === 'single' ? { data_fim: '' } : {}),
    }));
  }, []);

  const replaceFilters = useCallback((nextFilters: FilterState) => {
    setFilters({
      ...defaultFilters,
      ...nextFilters,
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilter,
    replaceFilters,
    resetFilters,
  };
}
