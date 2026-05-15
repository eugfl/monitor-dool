import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Materia, Edicao } from '@/types';
import type { FilterState } from './useFilters';
import { MateriaService, EdicaoService } from '@/services/api';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestMaterias, setMaterias] = useState<Materia[]>([]);
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [availableOrgaos, setAvailableOrgaos] = useState<string[]>([]);
  const [availableTipos, setAvailableTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
      };

      const [materiasRes, edicoesRes, orgaosStats, tiposStats] = await Promise.all([
        MateriaService.getMaterias(materiasParams),
        EdicaoService.getEdicoes(5),
        MateriaService.getStatsOrgaos(30),
        MateriaService.getStatsTipos()
      ]);

      setMaterias(materiasRes);
      setEdicoes(edicoesRes);
      setCurrentPage(page);
      
      // Mapear órgãos e tipos únicos para os filtros
      setAvailableOrgaos(orgaosStats.map(s => s.label).filter((v): v is string => !!v));
      setAvailableTipos(tiposStats.map(s => s.label).filter((v): v is string => !!v));

      // Calcular estatísticas reais baseadas nos tipos
      const totalMaterias = tiposStats.reduce((acc, curr) => acc + curr.value, 0);
      const nomeacoesCount = tiposStats.find(s => s.label === 'NOMEACAO' || s.label === 'NOMEAÇÃO')?.value || 0;
      const editaisCount = tiposStats.find(s => s.label === 'EDITAL' || s.label === 'LICITACAO' || s.label === 'LICITAÇÃO')?.value || 0;

      setStats({
        total_materias: totalMaterias,
        total_edicoes: edicoesRes.length,
        total_orgaos: orgaosStats.length,
        recent_nominations: nomeacoesCount,
        recent_edicts: editaisCount
      });
      
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Falha ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData(true);
    }

    return () => {
      isMounted = false;
    };
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
    refresh: (filters?: FilterState, page?: number) => fetchDashboardData(false, filters, page || 1)
  };
}
