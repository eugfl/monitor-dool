import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import type { Edicao } from '@/types';
import { formatDateLong } from '@/utils/formatters';

interface RecentEditionsProps {
  edicoes: Edicao[];
}

export function RecentEditions({ edicoes }: RecentEditionsProps) {
  const latestEditionId = edicoes[0]?.id;

  return (
    <Card className="flex h-full max-h-[220px] flex-col border-primary/20 bg-card p-5 shadow-sm">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-heading font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          Últimas edições
        </h2>
        <Button variant="ghost" asChild className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-primary">
          <Link to="/edicoes">Histórico</Link>
        </Button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {edicoes.map((edicao, idx) => {
          const isCurrent = edicao.id === latestEditionId;

          return (
            <motion.div
              key={edicao.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-lg border bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Edição {edicao.numero}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateLong(edicao.data)}</p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Atual
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                {edicao.total_materias} matérias processadas
              </p>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
