import { useMemo } from 'react';
import type { ReactNode } from 'react';
import DOMPurify from 'dompurify';
import { AlertTriangle, FileText } from 'lucide-react';

interface MateriaContentProps {
  html?: string | null;
  text?: string | null;
}

const PDF_MARKERS = ['%PDF-', 'endobj', 'xref', 'trailer', 'startxref', '%%EOF'];

function looksLikeRawContent(value?: string | null) {
  if (!value) return false;

  const sample = value.slice(0, 5000);
  const markers = PDF_MARKERS.filter((marker) => sample.includes(marker)).length;
  return sample.trimStart().startsWith('%PDF-') || markers >= 3;
}

export function MateriaContent({ html, text }: MateriaContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html || looksLikeRawContent(html)) return null;

    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
    });
  }, [html]);

  const hasRawText = looksLikeRawContent(text);

  if (sanitizedHtml) {
    return (
      <article className="materia-content text-base leading-relaxed text-foreground md:text-[17px]">
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </article>
    );
  }

  if (text && !hasRawText) {
    return (
      <article className="materia-content whitespace-pre-wrap text-base leading-relaxed text-foreground md:text-[17px]">
        {text}
      </article>
    );
  }

  if (hasRawText) {
    return (
      <ContentNotice
        icon={<AlertTriangle className="h-8 w-8 text-primary" />}
        title="Conteúdo textual indisponível"
        description="Esta publicação parece ter sido disponibilizada como arquivo bruto ou PDF pelo Diário Oficial. A fonte original ainda pode ser acessada pelo link da matéria."
      />
    );
  }

  return (
    <ContentNotice
      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      title="Conteúdo em processamento"
      description="O conteúdo integral desta matéria ainda não está disponível na base local."
    />
  );
}

function ContentNotice({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-4">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
