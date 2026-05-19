import { useDashboard } from '@/hooks/useDashboard';
import { useFilters } from '@/hooks/useFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { Filters } from '@/components/dashboard/Filters';
import { MateriaCard } from '@/components/dashboard/MateriaCard';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, LayoutList, ShieldCheck, CalendarDays, ExternalLink, RefreshCw, SearchX, Database, FileText } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MateriaService, getApiErrorMessage } from '@/services/api';
import { formatDateLong } from '@/utils/formatters';

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
    availableTipos 
  } = useDashboard();
  
  const { filters, updateFilter, resetFilters } = useFilters();
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const filtersRef = useRef(filters);
  const didRunSearchEffect = useRef(false);

  useEffect(() => {
    document.title = "Dashboard | Monitor DOOL";
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Debounce para busca textual
  const debouncedSearch = useDebounce(filters.q, 500);

  const handleApplyFilters = useCallback((page = 1) => {
    refresh(filtersRef.current, page);
  }, [refresh]);

  useEffect(() => {
    // Só dispara se houver texto ou se o texto foi limpo (mas ignorando o mount inicial)
    if (!didRunSearchEffect.current) {
      didRunSearchEffect.current = true;
      return;
    }

    refresh({ ...filtersRef.current, q: debouncedSearch }, 1);
  }, [debouncedSearch, refresh]);

  const handleTriggerColeta = async () => {
    if (!filters.data_inicio) return;
    
    setIsCollecting(true);
    setCollectionMsg(null);
    try {
      const res = await MateriaService.triggerColeta(filters.data_inicio, filters.data_fim);
      setCollectionMsg({ type: 'success', text: res.message });
      // Refresh after a delay to see if data appeared
      setTimeout(() => refresh(filters), 5000);
    } catch (error) {
      setCollectionMsg({ 
        type: 'error', 
        text: getApiErrorMessage(error, "Erro ao iniciar coleta. Verifique a data e tente novamente.") 
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const hasDateFilter = !!filters.data_inicio;


  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    refresh(filters, newPage);
    const container = document.querySelector('.custom-scrollbar');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
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
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Stats Row */}
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

           {/* Timeline Section */}
           <section className="bg-card border rounded-xl shadow-sm flex flex-col h-[750px]">
              <div className="p-6 border-b shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  Timeline · Matérias do Diário Oficial
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">
                    Página {currentPage}
                  </span>
                </div>
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
                      <h3 className="text-xl font-heading font-bold text-foreground">Nenhuma matéria encontrada</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {hasDateFilter 
                          ? `Não encontramos registros para o período de ${filters.data_inicio}${filters.data_fim ? ' até ' + filters.data_fim : ''}.`
                          : "Tente ajustar seus filtros ou use palavras-chave diferentes."}
                      </p>
                    </div>
                    
                    {hasDateFilter && (
                      <div className="pt-4 space-y-4 w-full max-w-sm">
                        <button 
                          type="button"
                          className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          onClick={() => {
                            handleTriggerColeta();
                          }}
                          disabled={isCollecting}
                        >
                          {isCollecting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Iniciando Coleta...
                            </div>
                          ) : (
                            <>
                              <Database className="w-4 h-4" />
                              Buscar diretamente no Diário Oficial
                            </>
                          )}
                        </button>
                        
                        {collectionMsg && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg text-xs font-medium ${
                              collectionMsg.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-200' : 'bg-red-500/10 text-red-600 border border-red-200'
                            }`}
                          >
                            {collectionMsg.text}
                          </motion.div>
                        )}
                      </div>
                    )}
                    
                    {!hasDateFilter && (
                      <Button variant="outline" onClick={resetFilters}>
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                ) : (
                  latestMaterias.map((materia, idx) => (
                    <MateriaCard key={materia.id} materia={materia} idx={idx} />
                  ))
                )}
              </div>
              
              {/* Pagination UI */}
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
                Ver Histórico Completo
              </Button>
           </section>

           {/* Informativo Lateral */}
           <div className="p-6 bg-muted/30 border border-dashed rounded-xl space-y-4">
              <div className="p-2 bg-primary/10 w-fit rounded-lg">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm">Base de Dados Confiável</h3>
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
