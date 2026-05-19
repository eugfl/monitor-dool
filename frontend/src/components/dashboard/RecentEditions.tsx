import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import type { Edicao } from '@/types';
import { formatDateLong } from '@/utils/formatters';

interface RecentEditionsProps {
  edicoes: Edicao[];
}

export function RecentEditions({ edicoes }: RecentEditionsProps) {
  return (
    <aside className="space-y-8">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-heading font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            Últimas edições
          </h2>
        </div>

        <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:border-dashed before:bg-border">
          {edicoes.slice(0, 3).map((edicao, idx) => (
            <motion.div
              key={edicao.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative cursor-pointer pl-10"
            >
              <div className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-background text-[10px] font-bold text-primary shadow-sm transition-all group-hover:scale-110 group-hover:border-primary">
                #{String(edicao.numero).slice(-3)}
              </div>
              <div className="rounded-lg border border-transparent bg-muted/20 p-3 transition-all group-hover:border-primary/20 group-hover:bg-primary/[0.02]">
                <p className="text-sm font-bold transition-colors group-hover:text-primary">
                  Edição {edicao.numero}
                </p>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  {formatDateLong(edicao.data)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {edicao.total_materias} matérias
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Button variant="ghost" asChild className="mt-6 w-full text-xs font-bold text-muted-foreground hover:text-primary">
          <Link to="/edicoes">Ver histórico completo</Link>
        </Button>
      </section>

      <Card className="border-dashed bg-muted/30 p-6">
        <div className="w-fit rounded-lg bg-primary/10 p-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-sm">Base de dados confiável</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Dados extraídos do Diário Oficial da Bahia, processados para busca e leitura técnica.
        </p>
      </Card>
    </aside>
  );
}
