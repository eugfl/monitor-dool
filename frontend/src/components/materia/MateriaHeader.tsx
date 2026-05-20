import { Building2, Calendar, FileText } from 'lucide-react';

import type { Materia } from '@/types';
import { formatDateLong } from '@/utils/formatters';

interface MateriaHeaderProps {
  materia: Materia;
}

export function MateriaHeader({ materia }: MateriaHeaderProps) {
  const publicationDate = materia.edicao_data || materia.created_at;

  return (
    <header className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          {materia.tipo_documental}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {publicationDate ? formatDateLong(publicationDate) : 'Data não informada'}
        </span>
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-heading font-bold leading-tight md:text-4xl">
          {materia.titulo}
        </h1>
        <div className="flex flex-wrap items-center gap-4 border-y py-4 text-sm text-muted-foreground">
          {materia.orgao && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-semibold">{materia.orgao}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>ID: {materia.materia_id_original}</span>
          </div>
          {materia.edicao_numero && (
            <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
              Edição {materia.edicao_numero}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
