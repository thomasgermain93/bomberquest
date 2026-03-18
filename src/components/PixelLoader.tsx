import { cn } from '@/lib/utils';

type PixelLoaderSize = 'sm' | 'md' | 'lg';
type PixelLoaderColor = 'primary' | 'gold' | 'blue';

interface PixelLoaderProps {
  size?: PixelLoaderSize;
  label?: string;
  color?: PixelLoaderColor;
  className?: string;
}

const SIZE_MAP: Record<PixelLoaderSize, string> = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2.5 h-2.5',
};

const COLOR_MAP: Record<PixelLoaderColor, string> = {
  primary: 'bg-primary',
  gold: 'bg-[hsl(var(--game-gold))]',
  blue: 'bg-[hsl(var(--game-neon-blue))]',
};

export function PixelLoader({
  size = 'md',
  label,
  color = 'primary',
  className,
}: PixelLoaderProps) {
  const dotSize = SIZE_MAP[size];
  const dotColor = COLOR_MAP[color];
  const textSize = size === 'lg' ? 'text-[8px]' : 'text-[7px]';

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <span className={cn('pixel-loader-dot', dotSize, dotColor)} />
        <span className={cn('pixel-loader-dot', dotSize, dotColor)} />
        <span className={cn('pixel-loader-dot', dotSize, dotColor)} />
      </div>
      {label && (
        <p className={cn('font-pixel text-muted-foreground', textSize)}>{label}</p>
      )}
    </div>
  );
}

export default PixelLoader;
