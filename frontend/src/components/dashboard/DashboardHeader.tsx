import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  isBusy: boolean;
  latestCollectionLabel: string;
}

export function DashboardHeader({ isBusy, latestCollectionLabel }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-heading font-bold tracking-tight md:text-5xl"
        >
          MONITOR <span className="text-primary">DOOL</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-lg text-muted-foreground"
        >
          Diário Oficial da Bahia, busca inteligente e timeline jurídica.
        </motion.p>
      </div>

      <div className="flex w-fit items-center gap-3 rounded-full border border-dashed bg-muted/50 px-4 py-2 text-[10px] font-bold text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-3 w-3 ${isBusy ? 'animate-spin' : ''}`} />
          ÚLTIMA COLETA: {latestCollectionLabel}
        </div>
      </div>
    </div>
  );
}
