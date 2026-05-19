import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { FeedbackBanner } from '@/components/dashboard/FeedbackBanner';
import { Filters } from '@/components/dashboard/Filters';
import { RecentEditions } from '@/components/dashboard/RecentEditions';
import { TimelineSection } from '@/components/dashboard/TimelineSection';
import { useDashboard } from '@/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { defaultFilters, type FilterState, useFilters } from '@/hooks/useFilters';
import { EdicaoService, MateriaService, getApiErrorMessage, isApiNotFound } from '@/services/api';
import { formatDateShort } from '@/utils/formatters';

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
    availableTipos,
  } = useDashboard(initialFilters, initialPage);

  const { filters, updateFilter, replaceFilters, resetFilters } = useFilters(initialFilters);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const filtersRef = useRef(filters);
  const currentPageRef = useRef(currentPage);
  const skipNextUrlSync = useRef(false);
  const didRunSearchEffect = useRef(false);
  const didCheckTodayCollection = useRef(false);
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
  const latestEditionLabel = stats?.ultima_edicao_data ? formatDateShort(stats.ultima_edicao_data) : '--';

  useEffect(() => {
    document.title = 'Dashboard | Monitor DOOL';
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const updateUrlState = useCallback((nextFilters: FilterState, page = 1, replace = false) => {
    skipNextUrlSync.current = true;
    setSearchParams(buildDashboardSearchParams(nextFilters, page), { replace });
  }, [setSearchParams]);

  useEffect(() => {
    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false;
      return;
    }

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
    refresh(requestFilters, page);
  }, [refresh, updateUrlState]);

  useEffect(() => {
    if (!didRunSearchEffect.current) {
      didRunSearchEffect.current = true;
      return;
    }

    const nextFilters = getRequestFilters({ ...filtersRef.current, q: debouncedSearch });
    updateUrlState(nextFilters, 1, true);
    refresh(nextFilters, 1);
  }, [debouncedSearch, refresh, updateUrlState]);

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
    setCollectionMsg({
      type: 'info',
      text: dataFim
        ? `Coletando edições de ${dataInicio} até ${dataFim}. Isso pode levar alguns instantes.`
        : `Coletando edição de ${dataInicio}. A timeline será atualizada automaticamente.`,
    });

    try {
      const res = await MateriaService.triggerColeta(dataInicio, dataFim);
      const finalStatus = await waitForCollectionStatus(res.job_id);
      await refresh(filtersRef.current);

      toast.dismiss(loadingToast);

      if (finalStatus?.status === 'no_edition' && source === 'auto') {
        const message = `Hoje (${todayLabel}) não tivemos Diário Oficial. Exibindo edições anteriores.`;
        setCollectionMsg({ type: 'info', text: message });
        toast.info(message);
        return;
      }

      if (!finalStatus) {
        const message = 'A coleta ainda está em andamento. A timeline foi atualizada com os dados disponíveis.';
        setCollectionMsg({ type: 'info', text: message });
        toast.info(message);
        return;
      }

      if (finalStatus.status === 'failed') {
        setCollectionMsg({ type: 'error', text: finalStatus.message });
        toast.error(finalStatus.message);
        return;
      }

      setCollectionMsg({
        type: finalStatus.status === 'no_edition' ? 'info' : 'success',
        text: finalStatus.message,
      });

      if (finalStatus.status === 'no_edition') {
        toast.info(finalStatus.message);
      } else {
        toast.success(finalStatus.message);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const message = getApiErrorMessage(err, 'Erro ao iniciar coleta. Verifique a data e tente novamente.');
      setCollectionMsg({ type: 'error', text: message });
      toast.error(message);
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

        const message = getApiErrorMessage(err, 'Não foi possível verificar a edição de hoje.');
        setCollectionMsg({ type: 'error', text: message });
        toast.error(message);
      }
    }

    ensureTodayEdition();
  }, [collectEdition, todayISO]);

  const handleTriggerColeta = async () => {
    await collectEdition(filters.data_inicio, filters.data_fim || undefined, 'manual');
  };

  const handleResetFilters = () => {
    resetFilters();
    updateUrlState(defaultFilters, 1);
    refresh(defaultFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const requestFilters = getRequestFilters(filters);
    updateUrlState(requestFilters, newPage);
    refresh(requestFilters, newPage);
    document.querySelector('.custom-scrollbar')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <header className="mb-12 space-y-4">
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

      <FeedbackBanner
        error={error}
        loading={loading}
        currentPage={currentPage}
        collection={collectionMsg}
        isCollecting={isCollecting}
        onRetry={handleApplyFilters}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <DashboardSummary stats={stats} latestEditionLabel={latestEditionLabel} />

          <TimelineSection
            materias={latestMaterias}
            loading={loading}
            error={error}
            currentPage={currentPage}
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

        <RecentEditions edicoes={edicoes} />
      </div>
    </div>
  );
}
