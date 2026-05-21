import { cn } from '@/lib/utils';

interface ProductThumbProps {
  name: string;
  price?: string;
  imageUrl?: string | null;
  /** Stable index used to derive a hsl-tinted placeholder gradient */
  index: number;
  /** Simple variant omits the price */
  simple?: boolean;
}

/**
 * Card used inside the product preview grids (Shopify + Printful). Falls
 * back to an HSL gradient + emoji placeholder when no image URL is
 * provided so the layout is stable even before catalogue data lands.
 */
export function ProductThumb({ name, price, imageUrl, index, simple }: ProductThumbProps) {
  const hue = (index * 47) % 360;
  return (
    <div className="overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.025]">
      <div
        className="relative flex items-center justify-center"
        style={{
          aspectRatio: '4 / 3',
          background: imageUrl
            ? `center / cover no-repeat url(${imageUrl})`
            : `linear-gradient(135deg, hsl(${hue}, 60%, 55%) 0%, hsl(${(hue + 40) % 360}, 60%, 35%) 100%)`,
        }}
      >
        {!imageUrl && (
          <span aria-hidden="true" className="text-[36px] opacity-40">
            👕
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/70 backdrop-blur">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className={cn('px-3 py-2.5', simple ? 'pb-3' : undefined)}>
        <div className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-white">
          {name}
        </div>
        {!simple && price && (
          <div className="mt-1.5 font-mono text-[11.5px] text-white/50">{price}</div>
        )}
      </div>
    </div>
  );
}
