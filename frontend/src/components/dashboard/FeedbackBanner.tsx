import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/button';

interface FeedbackBannerProps {
  error: string | null;
  loading: boolean;
  currentPage: number;
  collection: { type: 'success' | 'error' | 'info'; text: string } | null;
  isCollecting: boolean;
  onRetry: (page: number) => void;
}

export function FeedbackBanner({
  error,
  loading,
  currentPage,
  collection,
  isCollecting,
  onRetry,
}: FeedbackBannerProps) {
  return (
    <>
      {error && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Não foi possível atualizar os dados</p>
              <p className="text-destructive/80">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onRetry(currentPage)}
            disabled={loading}
          >
            {loading ? 'Tentando...' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {collection && (
        <div
          className={`flex flex-col justify-between gap-4 rounded-xl border p-4 text-sm md:flex-row md:items-center ${
            collection.type === 'error'
              ? 'border-destructive/20 bg-destructive/10 text-destructive'
              : collection.type === 'success'
                ? 'border-green-200 bg-green-500/10 text-green-700'
                : 'border-primary/20 bg-primary/10 text-foreground'
          }`}
        >
          <div className="flex items-start gap-3">
            <RefreshCw className={`mt-0.5 h-5 w-5 shrink-0 ${isCollecting ? 'animate-spin' : ''}`} />
            <div>
              <p className="font-bold">
                {isCollecting ? 'Coleta em andamento' : collection.type === 'success' ? 'Base atualizada' : 'Aviso de coleta'}
              </p>
              <p className="text-muted-foreground">{collection.text}</p>
            </div>
          </div>
          {isCollecting && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Atualizando automaticamente
            </span>
          )}
        </div>
      )}
    </>
  );
}
