import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { Filters } from '@/components/dashboard/Filters';
import { RecentEditions } from '@/components/dashboard/RecentEditions';
import { TimelineSection } from '@/components/dashboard/TimelineSection';
import { useDashboard } from '@/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { defaultFilters, type FilterState, useFilters } from '@/hooks/useFilters';
import { EdicaoService, MateriaService, getApiErrorMessage, isApiNotFound } from '@/services/api';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const finalCollectionStatuses = new Set(['success', 'no_edition', 'failed']);
const filterKeys = ['q', 'tipo', 'dateMode', 'data_inicio', 'data_fim'] as const;

function getTodayISO() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const dateMode = searchParams.get('dateMode') === 'range' ? 'range' : 'single';

  return {
    q: searchParams.get('q') || defaultFilters.q,
    tipo: searchParams.get('tipo') || defaultFilters.tipo,
    dateMode,
    data_inicio: searchParams.get('data_inicio') || defaultFilters.data_inicio,
    data_fim: searchParams.get('data_fim') || defaultFilters.data_fim,
  };
}

function getPageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') || '1');
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildDashboardSearchParams(filters: FilterState, page: number) {
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

function areFiltersEqual(left: FilterState, right: FilterState) {
  return filterKeys.every((key) => left[key] === right[key]);
}

function getRequestFilters(filters: FilterState): FilterState {
  if (filters.dateMode === 'single' && filters.data_inicio) {
    return {
      ...filters,
      data_fim: filters.data_inicio,
    };
  }

  return filters;
}

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialFilters] = useState(() => getFiltersFromSearchParams(searchParams));
  const [initialPage] = useState(() => getPageFromSearchParams(searchParams));
  const {
    stats,
    latestMaterias,
    edicoes,
    loading,
    error,
    refresh,
    currentPage,
    hasNextPage,
    availableTipos,
  } = useDashboard(initialFilters, initialPage);

  const { filters, updateFilter, replaceFilters } = useFilters(initialFilters);
  const [isCollecting, setIsCollecting] = useState(false);
  const filtersRef = useRef(filters);
  const currentPageRef = useRef(currentPage);
  const didRunSearchEffect = useRef(false);
  const didCheckTodayCollection = useRef(false);
  const lastErrorToastRef = useRef<string | null>(null);
  const todayISO = getTodayISO();
  const todayLabel = new Date(`${todayISO}T12:00:00`).toLocaleDateString('pt-BR');

  const hasDateFilter = !!filters.data_inicio;
  const hasActiveFilters = filters.q !== '' || filters.tipo !== 'all' || filters.data_inicio !== '' || filters.data_fim !== '';
  const latestCollectionLabel = stats?.ultima_coleta_em
    ? new Date(stats.ultima_coleta_em).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Sem coleta';

  useEffect(() => {
    document.title = 'Dashboard | Monitor DOOL';
  }, []);

  useEffect(() => {
    if (!error || lastErrorToastRef.current === error) return;
    lastErrorToastRef.current = error;
    toast.error(error);
  }, [error]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const updateUrlState = useCallback((nextFilters: FilterState, page = 1, replace = false) => {
    setSearchParams(buildDashboardSearchParams(nextFilters, page), { replace });
  }, [setSearchParams]);

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(searchParams);
    const nextPage = getPageFromSearchParams(searchParams);

    if (areFiltersEqual(nextFilters, filtersRef.current) && nextPage === currentPageRef.current) {
      return;
    }

    replaceFilters(nextFilters);
    refresh(nextFilters, nextPage);
  }, [replaceFilters, refresh, searchParams]);

  const debouncedSearch = useDebounce(filters.q, 500);

  const handleApplyFilters = useCallback((page = 1) => {
    const requestFilters = getRequestFilters(filtersRef.current);
    updateUrlState(requestFilters, page);
  }, [updateUrlState]);

  useEffect(() => {
    if (!didRunSearchEffect.current) {
      didRunSearchEffect.current = true;
      return;
    }

    const currentQ = searchParams.get('q') || '';
    if (debouncedSearch === currentQ) {
      return;
    }

    const nextFilters = getRequestFilters({ ...filtersRef.current, q: debouncedSearch });
    updateUrlState(nextFilters, 1, true);
  }, [debouncedSearch, searchParams, updateUrlState]);

  const waitForCollectionStatus = useCallback(async (jobId: string) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await wait(3000);
      const status = await MateriaService.getColetaStatus(jobId);

      if (finalCollectionStatuses.has(status.status)) {
        return status;
      }
    }

    return null;
  }, []);

  const collectEdition = useCallback(async (dataInicio: string, dataFim?: string, source: 'auto' | 'manual' = 'manual') => {
    if (!dataInicio) return;

    const loadingToast = toast.loading(dataFim ? 'Coletando período selecionado...' : 'Coletando edição...');
    setIsCollecting(true);

    try {
      const res = await MateriaService.triggerColeta(dataInicio, dataFim);
      const finalStatus = await waitForCollectionStatus(res.job_id);
      await refresh(filtersRef.current);

      toast.dismiss(loadingToast);

      if (finalStatus?.status === 'no_edition' && source === 'auto') {
        toast.info(`Hoje (${todayLabel}) não tivemos Diário Oficial. Exibindo edições anteriores.`);
        return;
      }

      if (!finalStatus) {
        toast.info('A coleta ainda está em andamento. A timeline foi atualizada com os dados disponíveis.');
        return;
      }

      if (finalStatus.status === 'failed') {
        toast.error(finalStatus.message);
        return;
      }

      if (finalStatus.status === 'no_edition') {
        toast.info(finalStatus.message);
      } else {
        toast.success(finalStatus.message);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(getApiErrorMessage(err, 'Erro ao iniciar coleta. Verifique a data e tente novamente.'));
    } finally {
      setIsCollecting(false);
    }
  }, [refresh, todayLabel, waitForCollectionStatus]);

  useEffect(() => {
    if (didCheckTodayCollection.current) return;
    didCheckTodayCollection.current = true;

    async function ensureTodayEdition() {
      try {
        await EdicaoService.getEdicaoByDate(todayISO);
      } catch (err) {
        if (isApiNotFound(err)) {
          await collectEdition(todayISO, undefined, 'auto');
          return;
        }

        toast.error(getApiErrorMessage(err, 'Não foi possível verificar a edição de hoje.'));
      }
    }

    ensureTodayEdition();
  }, [collectEdition, todayISO]);

  const handleTriggerColeta = async () => {
    await collectEdition(filters.data_inicio, filters.data_fim || undefined, 'manual');
  };

  const handleResetFilters = () => {
    updateUrlState(defaultFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const requestFilters = getRequestFilters(filters);
    updateUrlState(requestFilters, newPage);
    document.querySelector('.timeline-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <DashboardHeader isBusy={loading || isCollecting} latestCollectionLabel={latestCollectionLabel} />

        <Filters
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={handleResetFilters}
          onApply={() => handleApplyFilters(1)}
          availableTipos={availableTipos}
          isLoading={loading}
        />
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <DashboardSummary stats={stats} />
        <RecentEditions edicoes={edicoes} />
      </section>

      <TimelineSection
        materias={latestMaterias}
        loading={loading}
        error={error}
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        filters={filters}
        hasDateFilter={hasDateFilter}
        hasActiveFilters={hasActiveFilters}
        isCollecting={isCollecting}
        onApplyFilters={handleApplyFilters}
        onCollectSelectedDate={handleTriggerColeta}
        onCollectToday={() => collectEdition(todayISO, undefined, 'manual')}
        onResetFilters={handleResetFilters}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
