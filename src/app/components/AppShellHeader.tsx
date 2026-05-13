import type { ReactNode } from 'react';
import { xuLogo } from '../constants/xuLogo';

type AppShellHeaderProps = {
  actions?: ReactNode;
};

export function AppShellHeader({ actions }: AppShellHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex max-w-7xl flex-row flex-nowrap items-center justify-between gap-2 py-2.5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:gap-3 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <img src={xuLogo} alt="XU Logo" className="h-9 w-auto shrink-0 sm:h-11" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-[var(--xu-blue)] sm:text-lg">
              CAMP-RISK
            </h1>
            <p className="truncate text-[11px] text-slate-500 sm:text-[13px]">Risk Management System</p>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2.5 [&_button.app-btn-outline]:min-h-9 [&_button.app-btn-outline]:px-2.5 [&_button.app-btn-outline]:text-xs sm:[&_button.app-btn-outline]:min-h-10 sm:[&_button.app-btn-outline]:px-4 sm:[&_button.app-btn-outline]:text-sm">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
