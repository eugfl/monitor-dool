import { useCallback, useEffect, useRef, useState } from 'react';

import type { DashboardStats, Edicao, Materia } from '@/types';
import { EdicaoService, MateriaService, getApiErrorMessage } from '@/services/api';
import type { FilterState } from './useFilters';

export function useDashboard(initialFilters?: FilterState, initialPage = 1) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestMaterias, setMaterias] = useState<Materia[]>([]);
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [availableOrgaos, setAvailableOrgaos] = useState<string[]>([]);
  const [availableTipos, setAvailableTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const initialFiltersRef = useRef(initialFilters);
  const initialPageRef = useRef(initialPage);

  const fetchDashboardData = useCallback(async (isInitial = false, filterState?: FilterState, page = 1) => {
    try {
      if (!isInitial) setLoading(true);
      setError(null);

      const materiasParams = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        q: filterState?.q || undefined,
        orgao: filterState?.orgao !== 'all' ? filterState?.orgao : undefined,
        tipo: filterState?.tipo !== 'all' ? filterState?.tipo : undefined,
        data_inicio: filterState?.data_inicio || undefined,
        data_fim: filterState?.data_fim || undefined,
      };

      const [materiasRes, edicoesRes, orgaosStats, tiposStats, dashboardSummary] = await Promise.all([
        MateriaService.getMaterias(materiasParams),
        EdicaoService.getEdicoes(5),
        MateriaService.getStatsOrgaos(30),
        MateriaService.getStatsTipos(),
        MateriaService.getDashboardSummary(),
      ]);

      setMaterias(materiasRes);
      setEdicoes(edicoesRes);
      setCurrentPage(page);
      setAvailableOrgaos(orgaosStats.map((stat) => stat.label).filter((value): value is string => !!value));
      setAvailableTipos(tiposStats.map((stat) => stat.label).filter((value): value is string => !!value));
      setStats(dashboardSummary);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar dados do servidor.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData(true, initialFiltersRef.current, initialPageRef.current);
  }, [fetchDashboardData]);

  const refresh = useCallback((filters?: FilterState, page = 1) => {
    return fetchDashboardData(false, filters, page);
  }, [fetchDashboardData]);

  return {
    stats,
    latestMaterias,
    edicoes,
    availableOrgaos,
    availableTipos,
    loading,
    error,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    refresh,
  };
}
