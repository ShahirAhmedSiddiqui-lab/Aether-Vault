import Link from 'next/link';
import { ArrowLeft, Settings2, UserRound } from 'lucide-react';
import { BrandLockup } from '@/app/_components/brand-lockup';
import { cn } from '@/lib/utils';

type AccountShellProps = {
  title: string;
  description: string;
  current: 'profile' | 'settings';
  children: React.ReactNode;
};

export function AccountShell({ title, description, current, children }: AccountShellProps) {
  const navItems = [
    {
      href: '/profile',
      label: 'Profile',
      icon: UserRound,
      key: 'profile' as const,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings2,
      key: 'settings' as const,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f8f5ef,_#fbfbfd_50%,_#ffffff_100%)] text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="w-full rounded-[30px] border border-neutral-200 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:sticky lg:top-8 lg:w-80 lg:p-6">
          <div className="flex items-center justify-between gap-4">
            <BrandLockup size="sm" />
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Vault
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Account Center</p>
            <h1 className="text-3xl font-black tracking-tight text-neutral-950">{title}</h1>
            <p className="text-sm leading-7 text-neutral-600">{description}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                    current === item.key
                      ? 'border-neutral-900 bg-neutral-950 text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-900 hover:bg-white hover:text-neutral-950'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="w-full flex-1">{children}</section>
      </div>
    </main>
  );
}
