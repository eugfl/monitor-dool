import { AlertCircle, CheckCircle2, Tag } from 'lucide-react';

import { Card } from '@/components/card';
import type { EntityExtractionResult, EntityValue } from '@/types';

interface MateriaEntitiesProps {
  entidades?: EntityExtractionResult | null;
}

const RESERVED_KEYS = new Set(['items', 'summary']);

function getEntityItems(entidades?: EntityExtractionResult | null) {
  if (!entidades) return {};

  if (entidades.items) {
    return entidades.items;
  }

  return Object.entries(entidades).reduce<Record<string, string[]>>((acc, [key, value]) => {
    if (RESERVED_KEYS.has(key) || !Array.isArray(value)) return acc;
    acc[key] = value.map((item) => String(item));
    return acc;
  }, {});
}

function getFallbackLabel(type: string) {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderEntityValue(value: EntityValue) {
  return String(value);
}

export function MateriaEntities({ entidades }: MateriaEntitiesProps) {
  const items = getEntityItems(entidades);
  const summary = entidades?.summary;
  const entries = Object.entries(items).filter(([, values]) => values.length > 0);

  const status = summary?.status || (entries.length > 0 ? 'ok' : 'empty');
  const message = summary?.message || 'Nenhuma entidade confiável foi identificada.';

  return (
    <Card className="border-dashed bg-muted/20 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
        <Tag className="h-4 w-4 text-primary" />
        Entidades extraídas
      </h3>

      <div className="mb-4 flex items-start gap-2 rounded-lg border bg-background/70 p-3">
        {status === 'ok' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
      </div>

      {entries.length > 0 && (
        <div className="space-y-4">
          {entries.map(([type, values]) => {
            const label = summary?.types?.[type]?.label || getFallbackLabel(type);

            return (
              <div key={type} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.slice(0, 8).map((value) => (
                    <span key={`${type}-${value}`} className="rounded border bg-background px-2 py-1 text-[11px] font-medium shadow-sm">
                      {renderEntityValue(value)}
                    </span>
                  ))}
                </div>
                {values.length > 8 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{values.length - 8} itens adicionais
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
