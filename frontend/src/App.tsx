import { Layout } from '@/components/layout/Layout';
import { useDashboard } from '@/hooks/useDashboard';
import { motion } from 'framer-motion';

function App() {
  const { stats, latestMaterias, edicoes, loading } = useDashboard();

  return (
    <Layout>
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-12 space-y-2">
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
        </header>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {/* Timeline Section */}
             <section className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  Timeline · Últimas Matérias
                </h2>
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">
                      Buscando atualizações...
                    </div>
                  ) : (
                    latestMaterias.map((materia, idx) => (
                      <motion.div 
                        key={materia.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md hover:shadow-primary/5 bg-card"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {materia.tipo_documental || 'MATÉRIA'}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {new Date(materia.data_publicacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {materia.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {materia.resumo}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t pt-4 border-dashed">
                          <span className="text-[11px] font-medium text-muted-foreground/80">
                            🏛️ {materia.orgao || 'Órgão não especificado'}
                          </span>
                          <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            Ver detalhes →
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                
                {!loading && (
                  <button className="w-full mt-6 py-3 border border-dashed rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
                    Carregar mais matérias
                  </button>
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
