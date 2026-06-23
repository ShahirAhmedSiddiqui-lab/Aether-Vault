import Image from 'next/image';
import memoraLogo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type BrandLockupProps = {
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  logoClassName?: string;
  subtitle?: string;
  size?: 'sm' | 'md';
};

export function BrandLockup({
  className,
  titleClassName,
  subtitleClassName,
  logoClassName,
  subtitle = 'AI SECOND BRAIN',
  size = 'md',
}: BrandLockupProps) {
  const isSmall = size === 'sm';

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_rgba(15,15,16,0.12)] ring-1 ring-black/8',
          isSmall ? 'h-11 w-11' : 'h-14 w-14',
          logoClassName
        )}
      >
        <Image src={memoraLogo} alt="Memora logo" fill sizes={isSmall ? '44px' : '56px'} className="object-cover" priority />
      </div>

      <div className="min-w-0">
        <div
          className={cn(
            'truncate font-extrabold tracking-tight text-neutral-950',
            isSmall ? 'text-[1rem] leading-none' : 'text-[1.15rem] leading-none',
            titleClassName
          )}
        >
          Memora
        </div>
        <div
          className={cn(
            'mt-1 truncate font-mono font-bold uppercase tracking-[0.26em] text-neutral-400',
            isSmall ? 'text-[0.56rem]' : 'text-[0.63rem]',
            subtitleClassName
          )}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
