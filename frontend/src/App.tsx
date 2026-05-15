import { Layout } from '@/components/layout/Layout';
import { useDashboard } from '@/hooks/useDashboard';
import { useFilters } from '@/hooks/useFilters';
import { Filters } from '@/components/dashboard/Filters';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/button';

function App() {
  const { stats, latestMaterias, edicoes, loading, refresh, currentPage } = useDashboard();
  const { filters, updateFilter, resetFilters } = useFilters();

  const handleApplyFilters = (page = 1) => {
    refresh(filters, page);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    refresh(filters, newPage);
    // Scroll back to top of list
    const container = document.querySelector('.custom-scrollbar');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-12 space-y-4">
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
              className="text-muted-foreground text-lg"
            >
              Diário Oficial da Bahia • Busca inteligente • Insights • Timeline jurídica
            </motion.p>
          </div>

          <Filters 
            filters={filters} 
            updateFilter={updateFilter} 
            resetFilters={resetFilters}
            onApply={() => handleApplyFilters(1)}
          />
        </header>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {/* Timeline Section */}
             <section className="bg-card border rounded-xl shadow-sm flex flex-col h-[750px]">
                <div className="p-6 border-b shrink-0 flex items-center justify-between">
                  <h2 className="text-xl font-heading font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    Timeline · Matérias Recentes
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
                      Buscando atualizações...
                    </div>
                  ) : latestMaterias.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground italic">
                      Nenhuma matéria encontrada para os filtros selecionados.
                    </div>
                  ) : (
                    latestMaterias.map((materia, idx) => {
                      const getReadableType = (type: string) => {
                        const types: Record<string, { label: string, desc: string }> = {
                          'DECRETO': { label: 'Decreto', desc: 'Ato normativo do Executivo' },
                          'PORTARIA': { label: 'Portaria', desc: 'Instrução de serviço/órgão' },
                          'EDITAL': { label: 'Edital', desc: 'Comunicação oficial/Resumo' },
                          'LICITACAO': { label: 'Licitação', desc: 'Processo de compra pública' },
                          'CONTRATO': { label: 'Contrato', desc: 'Acordo firmado' },
                          'NOMEACAO': { label: 'Nomeação', desc: 'Provimento de cargo público' },
                          'EXONERACAO': { label: 'Exoneração', desc: 'Desligamento de cargo' },
                        };
                        return types[type] || { 
                          label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(), 
                          desc: 'Documento oficial' 
                        };
                      };

                      const info = getReadableType(materia.tipo_documental);

                      return (
                        <motion.div 
                          key={materia.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-5 border rounded-lg hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md hover:shadow-primary/5 bg-card hover:bg-primary/[0.01]"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {info.label}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium border-l pl-2">
                                <Info className="w-3 h-3 text-primary/60" />
                                <span>{info.desc}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {new Date(materia.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base leading-snug">
                            {materia.titulo}
                          </h3>
                          <div className="mt-4 flex items-center justify-between border-t pt-4 border-dashed">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-muted-foreground/90 flex items-center gap-1">
                                <span className="text-primary opacity-60">🏛️</span> 
                                {materia.orgao || 'Secretaria Geral'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              Ver na Íntegra →
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
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
                      disabled={latestMaterias.length < 10} // Simple check for next page
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
            {/* Insights Section */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-lg font-heading font-semibold mb-6 flex items-center gap-2 relative z-10">
                📊 Insights Rápidos
              </h2>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-card border p-4 rounded-lg shadow-sm">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Matérias</p>
                   <p className="text-2xl font-bold">{stats?.total_materias || 0}</p>
                </div>
                <div className="bg-card border p-4 rounded-lg shadow-sm">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Editais</p>
                   <p className="text-2xl font-bold text-primary">{stats?.recent_edicts || 0}</p>
                </div>
                <div className="bg-card border p-4 rounded-lg shadow-sm">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Nomeações</p>
                   <p className="text-2xl font-bold">{stats?.recent_nominations || 0}</p>
                </div>
                <div className="bg-card border p-4 rounded-lg shadow-sm">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Órgãos</p>
                   <p className="text-2xl font-bold">{stats?.total_orgaos || 0}</p>
                </div>
              </div>
            </section>

            {/* Last Editions */}
            <section>
              <h2 className="text-lg font-heading font-semibold mb-4 flex items-center justify-between">
                <span>🗂 Últimas Edições</span>
                <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer">Ver todas</span>
              </h2>
              <div className="space-y-3">
                {edicoes.map((edicao) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={edicao.id} 
                    className="flex items-center gap-4 p-3 bg-card border rounded-lg cursor-pointer hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      #{String(edicao.numero).slice(-3) || 'ED'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate uppercase tracking-tight">Edição {edicao.numero}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(edicao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </Layout>
  );
}

export default App;
