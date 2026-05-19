import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/sonner';
import { Dashboard } from '@/pages/Dashboard';
import { MateriaDetail } from '@/pages/MateriaDetail';

function App() {
  return (
    <Router>
      <Layout>
        <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materia/:id" element={<MateriaDetail />} />
          </Routes>
        </main>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
