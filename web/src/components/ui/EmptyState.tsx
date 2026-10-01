import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = "inbox", title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-space-xs py-space-xl px-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
      <span className="material-symbols-outlined text-on-surface-variant text-[36px]">{icon}</span>
      <h3 className="font-title-md text-title-md font-bold text-on-surface">{title}</h3>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">{description}</p>
      )}
      {action && <div className="mt-space-sm">{action}</div>}
    </div>
  );
};
