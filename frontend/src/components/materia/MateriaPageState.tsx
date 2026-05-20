import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/button';

export function MateriaLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-40">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="animate-pulse font-medium text-muted-foreground">Carregando conteúdo integral...</p>
    </div>
  );
}

export function MateriaErrorState({
  error,
  onBack,
  onRetry,
}: {
  error: string;
  onBack: () => void;
  onRetry: () => void;
}) {
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
        <Button variant="outline" onClick={onBack}>Voltar ao Dashboard</Button>
        <Button onClick={onRetry}>Tentar novamente</Button>
      </div>
    </div>
  );
}

export function MateriaNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="py-40 text-center">
      <h2 className="mb-4 text-2xl font-bold">Matéria não encontrada</h2>
      <Button onClick={onBack}>Voltar ao Dashboard</Button>
    </div>
  );
}
