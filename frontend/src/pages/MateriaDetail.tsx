import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MateriaService, getApiErrorMessage } from '@/services/api';
import type { EntityValue, Materia } from '@/types';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, Calendar, Building2, Tag, FileText, Download, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { formatDateLong, formatDateShort } from '@/utils/formatters';
import DOMPurify from 'dompurify';

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
      document.title = `${data.titulo.slice(0, 40)}... | Monitor DOOL`;
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

  const conteudoHtml = materia?.conteudo_html;
  const publicationDate = materia?.edicao_data || materia?.created_at;
  const sanitizedMateriaHtml = useMemo(() => {
    if (!conteudoHtml) {
      return null;
    }

    return DOMPurify.sanitize(conteudoHtml, {
      USE_PROFILES: { html: true },
    });
  }, [conteudoHtml]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Carregando conteúdo integral...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 py-40 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Não foi possível carregar a matéria</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
          <Button onClick={loadMateria}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!materia) {
    return (
      <div className="text-center py-40">
        <h2 className="text-2xl font-bold mb-4">Matéria não encontrada</h2>
        <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const renderEntityValue = (value: EntityValue) => String(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 hover:text-primary pl-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="p-8 md:p-12 shadow-xl border-none">
            <header className="mb-10 space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {materia.tipo_documental}
                </span>
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {publicationDate ? formatDateLong(publicationDate) : 'Data não informada'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight">
                {materia.titulo}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{materia.orgao || 'Secretaria Geral'}</span>
                </div>
                <div className="w-1 h-1 bg-muted rounded-full"></div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>ID: {materia.materia_id_original}</span>
                </div>
              </div>
            </header>

            <div className="bg-card border rounded-lg overflow-hidden shadow-inner bg-slate-50/30">
              <div className="h-[600px] overflow-y-auto p-8 md:p-10 custom-scrollbar">
                <article className="prose prose-slate max-w-none prose-headings:font-heading prose-p:leading-relaxed prose-table:border prose-table:border-border prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-td:border">
                  {sanitizedMateriaHtml ? (
                    <div
                      className="materia-content text-foreground font-serif text-lg"
                      dangerouslySetInnerHTML={{ __html: sanitizedMateriaHtml }}
                    />
                  ) : materia.texto ? (
                    <div
                      className="materia-content whitespace-pre-wrap text-foreground font-serif text-lg leading-relaxed"
                    >
                      {materia.texto}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted-foreground italic">
                      O conteúdo integral desta matéria está sendo processado ou não possui texto disponível.
                    </div>
                  )}
                </article>
              </div>
            </div>

            {materia.url && (
              <div className="mt-12 pt-8 border-t">
                <a
                  href={materia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                >
                  Ver fonte original no Diário Oficial
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6 bg-muted/20 border-dashed border-2">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Tag className="w-4 h-4 text-primary" />
              Entidades Extraídas
            </h3>
            <div className="space-y-4">
              {materia.entidades && Object.keys(materia.entidades).length > 0 ? (
                Object.entries(materia.entidades).map(([type, values]) => (
                  <div key={type} className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{type}</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(values) ? values.map((val, i) => (
                        <span key={i} className="px-2 py-1 bg-background border text-[11px] rounded font-medium shadow-sm">
                          {renderEntityValue(val)}
                        </span>
                      )) : (
                        <span className="px-2 py-1 bg-background border text-[11px] rounded font-medium shadow-sm">
                          {renderEntityValue(values)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Nenhuma entidade (nomes, valores, leis) foi identificada automaticamente nesta matéria.
                </p>
              )}
            </div>
          </Card>

          <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
            <h4 className="font-bold text-sm mb-2">Sobre esta publicação</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta matéria foi publicada na edição de {publicationDate ? formatDateShort(publicationDate) : 'data não informada'} e processada pela nossa inteligência jurídica para facilitar a sua leitura e análise estratégica.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
