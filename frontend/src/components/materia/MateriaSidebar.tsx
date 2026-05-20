import { Download, ExternalLink, Info } from 'lucide-react';

import { Card } from '@/components/card';
import { MateriaService } from '@/services/api';
import type { Materia } from '@/types';
import { formatDateShort } from '@/utils/formatters';
import { MateriaEntities } from './MateriaEntities';

interface MateriaSidebarProps {
  materia: Materia;
}

export function MateriaSidebar({ materia }: MateriaSidebarProps) {
  const publicationDate = materia.edicao_data || materia.created_at;

  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <MateriaEntities entidades={materia.entidades} />

      <Card className="border-primary/10 bg-primary/5 p-5">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Info className="h-4 w-4 text-primary" />
          Sobre esta publicação
        </h4>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Publicada em {publicationDate ? formatDateShort(publicationDate) : 'data não informada'} e processada para busca, leitura técnica e identificação de entidades.
        </p>
      </Card>

      {materia.pdf_disponivel && (
        <a
          href={MateriaService.getMateriaPdfUrl(materia.id)}
          download
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Baixar PDF
          <Download className="h-4 w-4" />
        </a>
      )}

      {materia.url && (
        <a
          href={materia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
        >
          Ver fonte original
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </aside>
  );
}
