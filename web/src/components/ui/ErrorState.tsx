import React from "react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Ocurrió un error al cargar la información.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-space-xs py-space-xl px-space-md rounded-xl bg-error-container/10 border border-error/30">
      <span className="material-symbols-outlined text-error text-[36px]">error</span>
      <p className="font-body-sm text-body-sm text-on-surface">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-space-sm px-space-md py-space-xs rounded bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};
