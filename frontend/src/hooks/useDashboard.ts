import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Materia, Edicao } from '@/types';
import { MateriaService, EdicaoService } from '@/services/api';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestMaterias, setMaterias] = useState<Materia[]>([]);
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setLoading(true);
      
      setError(null);
      
      const [materiasRes, edicoesRes] = await Promise.all([
        MateriaService.getMaterias({ limit: 10 }),
        EdicaoService.getEdicoes(5)
      ]);

      setMaterias(materiasRes);
      setEdicoes(edicoesRes);
      
      setStats({
        total_materias: materiasRes.length > 0 ? materiasRes[0].edicao_id * 10 : 484,
        total_edicoes: edicoesRes.length,
        total_orgaos: 12,
        recent_nominations: 8,
        recent_edicts: 15
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
    loading,
    error,
    refresh: () => fetchDashboardData(false)
  };
}
