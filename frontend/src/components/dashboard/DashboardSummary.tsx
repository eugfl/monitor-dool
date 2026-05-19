import { CalendarDays, FileText, LayoutList, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/card';
import type { DashboardStats } from '@/types';

interface DashboardSummaryProps {
  stats: DashboardStats | null;
  latestEditionLabel: string;
}

const items = [
  { key: 'materias', label: 'Matérias', helper: 'Na base local', icon: FileText },
  { key: 'edicoes', label: 'Edições', helper: 'Coletadas', icon: ShieldCheck },
  { key: 'orgaos', label: 'Órgãos', helper: 'Identificados', icon: LayoutList },
  { key: 'ultima', label: 'Última edição', helper: 'Aguardando coleta', icon: CalendarDays },
] as const;

export function DashboardSummary({ stats, latestEditionLabel }: DashboardSummaryProps) {
  const values = {
    materias: stats?.total_materias || 0,
    edicoes: stats?.total_edicoes || 0,
    orgaos: stats?.total_orgaos || 0,
    ultima: latestEditionLabel,
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const helper = item.key === 'ultima' && stats?.ultima_edicao_numero
          ? `Edição ${stats.ultima_edicao_numero}`
          : item.helper;

        return (
          <Card key={item.key} className="relative overflow-hidden border-primary/20 bg-primary/[0.02] p-5">
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover/card:opacity-20">
              <Icon className="h-14 w-14 text-primary" />
            </div>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
            </div>
            <p className="text-3xl font-bold tracking-tighter">{values[item.key]}</p>
            <p className="mt-1 text-[10px] font-bold text-primary">{helper}</p>
          </Card>
        );
      })}
    </div>
  );
}
