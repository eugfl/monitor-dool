import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  FileText,
  LayoutList,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Filters } from '@/components/dashboard/Filters';
import { MateriaCard } from '@/components/dashboard/MateriaCard';
import { useDashboard } from '@/hooks/useDashboard';
import { useDebounce } from '@/hooks/useDebounce';
import { useFilters } from '@/hooks/useFilters';
import { EdicaoService, MateriaService, getApiErrorMessage, isApiNotFound } from '@/services/api';
import { formatDateLong } from '@/utils/formatters';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const waitForCollectedEdition = useCallback(async (date: string) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await wait(4000);

      try {
        await EdicaoService.getEdicaoByDate(date);
        return true;
      } catch (err) {
        if (!isApiNotFound(err)) {
          throw err;
        }
      }
    }

    return false;
  }, []);

  const collectEdition = useCallback(async (dataInicio: string, dataFim?: string, source: 'auto' | 'manual' = 'manual') => {
    if (!dataInicio) return;

    setIsCollecting(true);
    setCollectionMsg({
      type: 'info',
      text: dataFim
        ? `Coletando edições de ${dataInicio} até ${dataFim}. Isso pode levar alguns instantes.`
        : `Coletando edição de ${dataInicio}. A timeline será atualizada automaticamente.`,
    });

    try {
      const res = await MateriaService.triggerColeta(dataInicio, dataFim);

      if (!dataFim) {
        const foundEdition = await waitForCollectedEdition(dataInicio);
        await refresh(filtersRef.current);

        if (!foundEdition && source === 'auto') {
          setCollectionMsg({
            type: 'info',
            text: `Hoje (${todayLabel}) não tivemos Diário Oficial. Exibindo edições anteriores.`,
          });
          return;
        }
      } else {
        await wait(5000);
        await refresh(filtersRef.current);
      }

      setCollectionMsg({ type: 'success', text: res.message });
    } catch (err) {
      setCollectionMsg({
        type: 'error',
        text: getApiErrorMessage(err, 'Erro ao iniciar coleta. Verifique a data e tente novamente.'),
      });
    } finally {
      setIsCollecting(false);
    }
  }, [refresh, todayLabel, waitForCollectedEdition]);

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

        setCollectionMsg({
          type: 'error',
          text: getApiErrorMessage(err, 'Não foi possível verificar a edição de hoje.'),
        });
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
    const container = document.querySelector('.custom-scrollbar');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <header className="mb-12 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-heading font-bold tracking-tight"
            >
              MONITOR <span className="text-primary">DOOL</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg max-w-2xl"
            >
              Diário Oficial da Bahia • Busca inteligente • Insights • Timeline jurídica
            </motion.p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-dashed">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3 h-3 ${loading || isCollecting ? 'animate-spin' : ''}`} />
              ATUALIZADO AGORA: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

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

      {error && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Não foi possível atualizar os dados</p>
              <p className="text-destructive/80">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => handleApplyFilters(currentPage)}
            disabled={loading}
          >
            {loading ? 'Tentando...' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {collectionMsg && (
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-4 text-sm ${
          collectionMsg.type === 'error'
            ? 'border-destructive/20 bg-destructive/10 text-destructive'
            : collectionMsg.type === 'success'
              ? 'border-green-200 bg-green-500/10 text-green-700'
              : 'border-primary/20 bg-primary/10 text-foreground'
        }`}>
          <div className="flex items-start gap-3">
            <RefreshCw className={`mt-0.5 h-5 w-5 shrink-0 ${isCollecting ? 'animate-spin' : ''}`} />
            <div>
              <p className="font-bold">
                {isCollecting ? 'Coleta em andamento' : collectionMsg.type === 'success' ? 'Base atualizada' : 'Aviso de coleta'}
              </p>
              <p className="text-muted-foreground">{collectionMsg.text}</p>
            </div>
          </div>
          {isCollecting && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Atualizando automaticamente
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden p-6 border-primary/20 bg-primary/[0.02] hover-lift group cursor-pointer">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-16 h-16 text-primary" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total de Matérias</p>
              </div>
              <p className="text-3xl font-bold tracking-tighter">{stats?.total_materias || 0}</p>
              <p className="text-[10px] text-primary font-bold mt-1">Sincronizado com a base oficial</p>
            </Card>

            <Card className="relative overflow-hidden p-6 border-primary/20 bg-primary/[0.02] hover-lift group cursor-pointer">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="w-16 h-16 text-primary" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nomeações Detectadas</p>
              </div>
              <p className="text-3xl font-bold tracking-tighter">{stats?.recent_nominations || 0}</p>
              <p className="text-[10px] text-primary font-bold mt-1">Filtro de RH Ativo</p>
            </Card>

            <Card className="relative overflow-hidden p-6 border-primary/20 bg-primary/[0.02] hover-lift group cursor-pointer">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <LayoutList className="w-16 h-16 text-primary" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <LayoutList className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Editais e Licitações</p>
              </div>
              <p className="text-3xl font-bold tracking-tighter">{stats?.recent_edicts || 0}</p>
              <p className="text-[10px] text-primary font-bold mt-1">Prioridade de Leitura</p>
            </Card>
          </div>

          <section className="bg-card border rounded-xl shadow-sm flex flex-col h-[750px]">
            <div className="p-6 border-b shrink-0 flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Timeline · Matérias do Diário Oficial
              </h2>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">
                Página {currentPage}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">
                  Consultando base de dados...
                </div>
              ) : error && latestMaterias.length === 0 ? (
                <div className="py-20 text-center bg-destructive/5 rounded-2xl border-2 border-dashed border-destructive/20 flex flex-col items-center gap-6 px-10">
                  <div className="p-4 bg-destructive/10 rounded-full">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-foreground">Falha ao carregar a timeline</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
                  </div>
                  <Button variant="outline" onClick={() => handleApplyFilters(currentPage)} disabled={loading}>
                    Tentar novamente
                  </Button>
                </div>
              ) : latestMaterias.length === 0 ? (
                <div className="py-20 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center gap-6 px-10">
                  <div className="p-4 bg-muted/20 rounded-full">
                    <SearchX className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      {hasActiveFilters ? 'Nenhuma matéria encontrada' : 'Ainda não há matérias na base'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {hasDateFilter
                        ? `Não encontramos registros para ${filters.data_fim ? `o período de ${filters.data_inicio} até ${filters.data_fim}` : `a edição de ${filters.data_inicio}`}.`
                        : hasActiveFilters
                          ? 'Tente ajustar seus filtros ou use palavras-chave diferentes.'
                          : 'A base local ainda está vazia. Você pode coletar a edição de hoje ou selecionar uma data nos filtros.'}
                    </p>
                  </div>

                  {hasDateFilter && (
                    <Button onClick={handleTriggerColeta} disabled={isCollecting}>
                      {isCollecting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Iniciando coleta...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Buscar diretamente no Diário Oficial
                        </span>
                      )}
                    </Button>
                  )}

                  {!hasDateFilter && !hasActiveFilters && (
                    <Button onClick={() => collectEdition(todayISO, undefined, 'manual')} disabled={isCollecting}>
                      {isCollecting ? 'Coletando edição de hoje...' : 'Coletar edição de hoje'}
                    </Button>
                  )}

                  {!hasDateFilter && hasActiveFilters && (
                    <Button variant="outline" onClick={resetFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                latestMaterias.map((materia, idx) => (
                  <MateriaCard key={materia.id} materia={materia} idx={idx} />
                ))
              )}
            </div>

            {!loading && latestMaterias.length > 0 && (
              <div className="p-4 border-t bg-muted/5 shrink-0 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-9 gap-1 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tighter">
                  Página {currentPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={latestMaterias.length < 10}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-9 gap-1 text-xs font-bold"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <section className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Últimas Edições
              </h2>
            </div>

            <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border before:border-dashed">
              {edicoes.slice(0, 3).map((edicao, idx) => (
                <motion.div
                  key={edicao.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-10 group cursor-pointer"
                >
                  <div className="absolute left-0 top-0 w-10 h-10 bg-background border-2 border-primary/20 rounded-full flex items-center justify-center text-primary text-[10px] font-bold z-10 group-hover:border-primary group-hover:scale-110 transition-all shadow-sm">
                    #{String(edicao.numero).slice(-3)}
                  </div>
                  <div className="p-3 bg-muted/20 border border-transparent group-hover:border-primary/20 group-hover:bg-primary/[0.02] rounded-lg transition-all">
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">Edição {edicao.numero}</p>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      {formatDateLong(edicao.data)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {edicao.total_materias} matérias
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-muted-foreground hover:text-primary">
              Ver histórico completo
            </Button>
          </section>

          <div className="p-6 bg-muted/30 border border-dashed rounded-xl space-y-4">
            <div className="p-2 bg-primary/10 w-fit rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-sm">Base de dados confiável</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Todos os dados são extraídos diretamente do <span className="font-bold text-foreground">Diário Oficial da Bahia</span>. Nossa inteligência processa cada termo para garantir que você encontre o que precisa em segundos.
            </p>
            <div className="pt-2">
              <span className="text-[10px] font-bold text-primary uppercase">Monitoramento 24/7</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
