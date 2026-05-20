import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { MateriaContent } from '@/components/materia/MateriaContent';
import { MateriaHeader } from '@/components/materia/MateriaHeader';
import {
  MateriaErrorState,
  MateriaLoadingState,
  MateriaNotFoundState,
} from '@/components/materia/MateriaPageState';
import { MateriaSidebar } from '@/components/materia/MateriaSidebar';
import { MateriaService, getApiErrorMessage } from '@/services/api';
import type { Materia } from '@/types';

export function MateriaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [materia, setMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMateria = useCallback(async () => {
    const materiaId = Number(id);

    if (!id || Number.isNaN(materiaId)) {
      setMateria(null);
      setError('O identificador da matéria é inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await MateriaService.getMateria(materiaId);
      setMateria(data);
      document.title = `${data.titulo.slice(0, 48)} | Monitor DOOL`;
    } catch (err) {
      setMateria(null);
      setError(getApiErrorMessage(err, 'Não foi possível carregar a matéria.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMateria();
  }, [loadMateria]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link da matéria copiado.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  if (loading) {
    return <MateriaLoadingState />;
  }

  if (error) {
    return (
      <MateriaErrorState
        error={error}
        onBack={() => navigate('/')}
        onRetry={loadMateria}
      />
    );
  }

  if (!materia) {
    return <MateriaNotFoundState onBack={() => navigate('/')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="w-fit gap-2 pl-0 hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Button variant="outline" size="sm" className="w-fit gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-8 border-primary/10 p-6 shadow-sm md:p-8">
          <MateriaHeader materia={materia} />
          <MateriaContent html={materia.conteudo_html} text={materia.texto} />
        </Card>

        <MateriaSidebar materia={materia} />
      </div>
    </motion.div>
  );
}
