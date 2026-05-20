import { describe, expect, it } from 'vitest';

import { defaultFilters } from '@/hooks/useFilters';
import {
  buildDashboardSearchParams,
  getFiltersFromSearchParams,
  getPageFromSearchParams,
  getRequestFilters,
  shouldSyncDebouncedSearch,
} from './dashboardUrlState';

describe('dashboard URL state', () => {
  it('reads textual search and pagination from URL params', () => {
    const params = new URLSearchParams('q=decreto&page=2');

    expect(getFiltersFromSearchParams(params)).toEqual({
      ...defaultFilters,
      q: 'decreto',
    });
    expect(getPageFromSearchParams(params)).toBe(2);
  });

  it('builds clean params and omits default filters', () => {
    const params = buildDashboardSearchParams(
      {
        ...defaultFilters,
        q: 'licitação',
      },
      1,
    );

    expect(params.toString()).toBe('q=licita%C3%A7%C3%A3o');
  });

  it('preserves page only when page is greater than one', () => {
    const firstPage = buildDashboardSearchParams(defaultFilters, 1);
    const secondPage = buildDashboardSearchParams(defaultFilters, 2);

    expect(firstPage.has('page')).toBe(false);
    expect(secondPage.get('page')).toBe('2');
  });

  it('treats single date without data_fim as an exact date filter', () => {
    const params = new URLSearchParams('dateMode=single&data_inicio=2026-05-09');

    expect(getFiltersFromSearchParams(params)).toMatchObject({
      dateMode: 'single',
      data_inicio: '2026-05-09',
      data_fim: '2026-05-09',
    });
  });

  it('turns single date requests into a closed interval for the API', () => {
    expect(
      getRequestFilters({
        ...defaultFilters,
        data_inicio: '2026-05-09',
      }),
    ).toMatchObject({
      data_inicio: '2026-05-09',
      data_fim: '2026-05-09',
    });
  });

  it('does not let stale debounced text rewrite the URL after reset', () => {
    expect(shouldSyncDebouncedSearch('licitação', '', '')).toBe(false);
    expect(shouldSyncDebouncedSearch('licitação', 'licitação', 'decreto')).toBe(true);
    expect(shouldSyncDebouncedSearch('licitação', 'licitação', 'licitação')).toBe(false);
  });
});
