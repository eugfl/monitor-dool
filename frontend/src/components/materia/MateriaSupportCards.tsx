import { Download, ExternalLink, Info } from 'lucide-react';

import { Card } from '@/components/card';
import { MateriaService } from '@/services/api';
import type { Materia } from '@/types';
import { formatDateShort } from '@/utils/formatters';
import { MateriaEntities } from './MateriaEntities';

interface MateriaSupportCardsProps {
  materia: Materia;
}

export function MateriaSupportCards({ materia }: MateriaSupportCardsProps) {
  const publicationDate = materia.edicao_data || materia.created_at;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)_minmax(240px,0.6fr)]">
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

      <Card className="flex flex-col gap-3 p-5">
        <h4 className="text-sm font-bold">Ações</h4>

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

        {!materia.pdf_disponivel && !materia.url && (
          <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            Nenhum arquivo externo foi informado para esta matéria.
          </p>
        )}
      </Card>
    </section>
  );
}
