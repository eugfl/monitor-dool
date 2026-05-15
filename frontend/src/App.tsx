import { Layout } from '@/components/layout/Layout';
import { useDashboard } from '@/hooks/useDashboard';
import { useFilters } from '@/hooks/useFilters';
import { Filters } from '@/components/dashboard/Filters';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, FileText, LayoutList, ShieldCheck, CalendarDays, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';

function App() {
  const { stats, latestMaterias, edicoes, loading, refresh, currentPage } = useDashboard();
  const { filters, updateFilter, resetFilters } = useFilters();

  const handleApplyFilters = (page = 1) => {
    refresh(filters, page);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    refresh(filters, newPage);
    const container = document.querySelector('.custom-scrollbar');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
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
          />
        </header>

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
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded cursor-pointer">
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
                            <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 cursor-pointer">
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
                    Edições Recentes
                  </h2>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Top 5</span>
                </div>
                
                <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border before:border-dashed">
                  {edicoes.slice(0, 5).map((edicao, idx) => (
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
                          {new Date(edicao.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
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
      </main>
    </Layout>
  );
}

export default App;
