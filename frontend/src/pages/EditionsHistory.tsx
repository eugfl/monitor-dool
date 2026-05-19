import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EdicaoService, getApiErrorMessage } from '@/services/api';
import type { Edicao } from '@/types';
import { formatDateLong } from '@/utils/formatters';

const ITEMS_PER_PAGE = 12;

function getPage(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page') || '1');
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getDashboardEditionUrl(edicao: Edicao) {
  const params = new URLSearchParams({
    dateMode: 'single',
    data_inicio: edicao.data,
    data_fim: edicao.data,
  });

  return `/?${params.toString()}`;
}

export function EditionsHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useMemo(() => getPage(searchParams), [searchParams]);

  const loadEditions = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await EdicaoService.getEdicoes(ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE);
      setEdicoes(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível carregar o histórico de edições.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Histórico de edições | Monitor DOOL';
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEditions(currentPage);
  }, [currentPage, loadEditions]);

  const handlePageChange = (page: number) => {
    if (page <= 1) {
      setSearchParams({});
      return;
    }

    setSearchParams({ page: String(page) });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="w-fit px-0 text-muted-foreground hover:text-primary">
            <Link to="/">← Voltar para dashboard</Link>
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight md:text-4xl">
              Histórico de edições
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Consulte edições já coletadas e abra a timeline filtrada por uma data específica.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="h-7 w-fit gap-2 px-3">
          <CalendarDays className="h-3.5 w-3.5" />
          Página {currentPage}
        </Badge>
      </header>

      {error && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Falha ao carregar edições</p>
              <p className="text-destructive/80">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => loadEditions(currentPage)}
            disabled={loading}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Edições coletadas
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-36 animate-pulse bg-muted/30 p-5" />
            ))
          ) : edicoes.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed bg-muted/10 p-10 text-center">
              <p className="font-heading text-lg font-semibold">Nenhuma edição coletada</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Assim que a primeira coleta terminar, ela aparecerá neste histórico.
              </p>
            </div>
          ) : (
            edicoes.map((edicao) => (
              <Card key={edicao.id} className="p-5 transition-colors hover:bg-primary/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Edição #{edicao.numero}
                    </p>
                    <h3 className="mt-1 text-lg font-heading font-semibold">
                      {formatDateLong(edicao.data)}
                    </h3>
                  </div>
                  <Badge variant="secondary">{edicao.tipo || 'DOOL'}</Badge>
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">
                    {edicao.total_materias} matérias
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={getDashboardEditionUrl(edicao)} className="gap-2">
                      Ver matérias
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t bg-muted/5 p-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <span className="text-xs font-bold uppercase text-muted-foreground">
            Página {currentPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={loading || edicoes.length < ITEMS_PER_PAGE}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
