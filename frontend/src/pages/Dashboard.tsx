import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { FeedbackBanner } from '@/components/dashboard/FeedbackBanner';
import { Filters } from '@/components/dashboard/Filters';
import { RecentEditions } from '@/components/dashboard/RecentEditions';
import { TimelineSection } from '@/components/dashboard/TimelineSection';
import { useDashboard } from '@/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { useFilters } from '@/hooks/useFilters';
import { EdicaoService, MateriaService, getApiErrorMessage, isApiNotFound } from '@/services/api';
import { formatDateShort } from '@/utils/formatters';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const finalCollectionStatuses = new Set(['success', 'no_edition', 'failed']);

function getTodayISO() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function Dashboard() {
  const {
    stats,
    latestMaterias,
    edicoes,
    loading,
    error,
    refresh,
    currentPage,
    availableOrgaos,
    availableTipos,
  } = useDashboard();

  const { filters, updateFilter, resetFilters } = useFilters();
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const filtersRef = useRef(filters);
  const didRunSearchEffect = useRef(false);
  const didCheckTodayCollection = useRef(false);
  const todayISO = getTodayISO();
  const todayLabel = new Date(`${todayISO}T12:00:00`).toLocaleDateString('pt-BR');

  const hasDateFilter = !!filters.data_inicio;
  const hasActiveFilters = filters.q !== '' || filters.orgao !== 'all' || filters.tipo !== 'all' || filters.data_inicio !== '' || filters.data_fim !== '';
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

  const debouncedSearch = useDebounce(filters.q, 500);

  const handleApplyFilters = useCallback((page = 1) => {
    refresh(filtersRef.current, page);
  }, [refresh]);

  useEffect(() => {
    if (!didRunSearchEffect.current) {
      didRunSearchEffect.current = true;
      return;
    }

    refresh({ ...filtersRef.current, q: debouncedSearch }, 1);
  }, [debouncedSearch, refresh]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    refresh(filters, newPage);
    document.querySelector('.custom-scrollbar')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <header className="mb-12 space-y-4">
        <DashboardHeader isBusy={loading || isCollecting} latestCollectionLabel={latestCollectionLabel} />

        <Filters
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          onApply={() => handleApplyFilters(1)}
          availableOrgaos={availableOrgaos}
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
            onResetFilters={resetFilters}
            onPageChange={handlePageChange}
          />
        </div>

        <RecentEditions edicoes={edicoes} />
      </div>
    </div>
  );
}
