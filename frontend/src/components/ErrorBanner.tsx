import { AlertTriangle, X } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="mb-3 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-current px-2.5 py-1 text-[13px] font-semibold transition-colors hover:bg-destructive/15"
        >
          Retry
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss" className="rounded-md p-1 hover:bg-destructive/15">
        <X className="size-4" />
      </button>
    </div>
  );
}
