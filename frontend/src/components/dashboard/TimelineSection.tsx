import { AlertCircle, ChevronLeft, ChevronRight, Database, SearchX } from 'lucide-react';

import { Button } from '@/components/button';
import type { Materia } from '@/types';
import type { FilterState } from '@/hooks/useFilters';
import { MateriaCard } from './MateriaCard';

interface TimelineSectionProps {
  materias: Materia[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasNextPage: boolean;
  filters: FilterState;
  hasDateFilter: boolean;
  hasActiveFilters: boolean;
  isCollecting: boolean;
  onApplyFilters: (page: number) => void;
  onCollectSelectedDate: () => void;
  onCollectToday: () => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
}

export function TimelineSection({
  materias,
  loading,
  error,
  currentPage,
  hasNextPage,
  filters,
  hasDateFilter,
  hasActiveFilters,
  isCollecting,
  onApplyFilters,
  onCollectSelectedDate,
  onCollectToday,
  onResetFilters,
  onPageChange,
}: TimelineSectionProps) {
  return (
    <section className="flex h-[750px] flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b p-6">
        <h2 className="flex items-center gap-2 text-xl font-heading font-semibold">
          <span className="h-6 w-1.5 rounded-full bg-primary" />
          Timeline · Matérias do Diário Oficial
        </h2>
        <span className="rounded bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Página {currentPage}
        </span>
      </div>

      <div className="timeline-scroll custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
        {loading ? (
          <div className="py-20 text-center font-medium text-muted-foreground animate-pulse">
            Consultando base de dados...
          </div>
        ) : error && materias.length === 0 ? (
          <TimelineError error={error} currentPage={currentPage} loading={loading} onRetry={onApplyFilters} />
        ) : materias.length === 0 ? (
          <TimelineEmpty
            filters={filters}
            hasDateFilter={hasDateFilter}
            hasActiveFilters={hasActiveFilters}
            isCollecting={isCollecting}
            onCollectSelectedDate={onCollectSelectedDate}
            onCollectToday={onCollectToday}
            onResetFilters={onResetFilters}
          />
        ) : (
          materias.map((materia, idx) => (
            <MateriaCard key={materia.id} materia={materia} idx={idx} />
          ))
        )}
      </div>

      {!loading && materias.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-muted/5 p-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-9 gap-1 text-xs font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <span className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground">
            Página {currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-9 gap-1 text-xs font-bold"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}

function TimelineError({
  error,
  currentPage,
  loading,
  onRetry,
}: {
  error: string;
  currentPage: number;
  loading: boolean;
  onRetry: (page: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-destructive/20 bg-destructive/5 px-10 py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-heading font-bold text-foreground">Falha ao carregar a timeline</h3>
        <p className="mx-auto max-w-md text-muted-foreground">{error}</p>
      </div>
      <Button variant="outline" onClick={() => onRetry(currentPage)} disabled={loading}>
        Tentar novamente
      </Button>
    </div>
  );
}

function TimelineEmpty({
  filters,
  hasDateFilter,
  hasActiveFilters,
  isCollecting,
  onCollectSelectedDate,
  onCollectToday,
  onResetFilters,
}: {
  filters: FilterState;
  hasDateFilter: boolean;
  hasActiveFilters: boolean;
  isCollecting: boolean;
  onCollectSelectedDate: () => void;
  onCollectToday: () => void;
  onResetFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-muted bg-muted/10 px-10 py-20 text-center">
      <div className="rounded-full bg-muted/20 p-4">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-heading font-bold text-foreground">
          {hasActiveFilters ? 'Nenhuma matéria encontrada' : 'Ainda não há matérias na base'}
        </h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          {hasDateFilter
            ? `Não encontramos registros para ${filters.data_fim ? `o período de ${filters.data_inicio} até ${filters.data_fim}` : `a edição de ${filters.data_inicio}`}.`
            : hasActiveFilters
              ? 'Tente ajustar seus filtros ou use palavras-chave diferentes.'
              : 'A base local ainda está vazia. Você pode coletar a edição de hoje ou selecionar uma data nos filtros.'}
        </p>
      </div>

      {hasDateFilter && (
        <Button onClick={onCollectSelectedDate} disabled={isCollecting}>
          {isCollecting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Iniciando coleta...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Buscar diretamente no Diário Oficial
            </span>
          )}
        </Button>
      )}

      {!hasDateFilter && !hasActiveFilters && (
        <Button onClick={onCollectToday} disabled={isCollecting}>
          {isCollecting ? 'Coletando edição de hoje...' : 'Coletar edição de hoje'}
        </Button>
      )}

      {!hasDateFilter && hasActiveFilters && (
        <Button variant="outline" onClick={onResetFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
