import type { ReactNode } from 'react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, children }: AuthShellProps) {
  return (
    <main className="mx-auto grid min-h-screen w-[min(760px,calc(100%-32px))] content-center py-8">
      <section className="task-panel">
        <p className="mb-1 text-sm font-bold uppercase text-mint">{eyebrow}</p>
        <h1 className="text-4xl font-black text-slate-950">{title}</h1>
        {children}
      </section>
    </main>
  );
}
