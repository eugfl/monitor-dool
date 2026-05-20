import { defaultFilters, type FilterState } from '@/hooks/useFilters';

const filterKeys = ['q', 'tipo', 'dateMode', 'data_inicio', 'data_fim'] as const;

export function getFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const dateMode = searchParams.get('dateMode') === 'range' ? 'range' : 'single';
  const dataInicio = searchParams.get('data_inicio') || defaultFilters.data_inicio;
  const dataFim = searchParams.get('data_fim') || defaultFilters.data_fim;

  return {
    q: searchParams.get('q') || defaultFilters.q,
    tipo: searchParams.get('tipo') || defaultFilters.tipo,
    dateMode,
    data_inicio: dataInicio,
    data_fim: dateMode === 'single' && dataInicio ? dataFim || dataInicio : dataFim,
  };
}

export function getPageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') || '1');
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function buildDashboardSearchParams(filters: FilterState, page: number) {
  const params = new URLSearchParams();

  filterKeys.forEach((key) => {
    const value = filters[key];
    if (!value || value === defaultFilters[key]) return;
    params.set(key, value);
  });

  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
}

export function areFiltersEqual(left: FilterState, right: FilterState) {
  return filterKeys.every((key) => left[key] === right[key]);
}

export function getRequestFilters(filters: FilterState): FilterState {
  if (filters.dateMode === 'single' && filters.data_inicio) {
    return {
      ...filters,
      data_fim: filters.data_inicio,
    };
  }

  return filters;
}

export function shouldSyncDebouncedSearch(
  debouncedSearch: string,
  currentFilterQuery: string,
  currentUrlQuery: string,
) {
  return debouncedSearch === currentFilterQuery && debouncedSearch !== currentUrlQuery;
}
