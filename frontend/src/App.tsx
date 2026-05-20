import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/sonner';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const EditionsHistory = lazy(() => import('@/pages/EditionsHistory').then((module) => ({ default: module.EditionsHistory })));
const MateriaDetail = lazy(() => import('@/pages/MateriaDetail').then((module) => ({ default: module.MateriaDetail })));

function RouteFallback() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card/70 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm font-medium text-muted-foreground">Carregando visualização...</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/edicoes" element={<EditionsHistory />} />
              <Route path="/materia/:id" element={<MateriaDetail />} />
            </Routes>
          </Suspense>
        </main>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
