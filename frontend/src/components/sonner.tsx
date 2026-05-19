import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'border-border bg-card text-card-foreground',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
