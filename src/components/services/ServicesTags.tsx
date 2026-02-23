'use client';

interface ServicesTagsProps {
  tags: string[];
  variant?: 'pill' | 'bracket' | 'glowing' | 'typographic' | 'kinetic';
  className?: string;
}

export function ServicesTags({ tags, variant = 'pill', className = '' }: ServicesTagsProps) {
  if (!tags?.length) return null;

  if (variant === 'pill') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-xs font-medium border border-white/20 rounded-full text-white/60 tracking-wide"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'bracket') {
    return (
      <div className={`flex flex-wrap gap-x-3 gap-y-2 ${className}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-mono text-[#a14dfd] tracking-wider uppercase"
          >
            [{tag}]
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'glowing') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-xs font-medium rounded-full text-[#a14dfd] border border-[#a14dfd]/40 tracking-wide"
            style={{ boxShadow: '0 0 12px rgba(161, 77, 253, 0.25)' }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'typographic') {
    return (
      <div className={`flex flex-wrap gap-x-6 gap-y-1 ${className}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs tracking-[0.2em] uppercase font-medium"
            style={{ color: '#b8a88a', letterSpacing: '0.18em' }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'kinetic') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#a14dfd]/10 text-[#a14dfd] border border-[#a14dfd]/30 tracking-wide transition-all duration-200 hover:bg-[#a14dfd]/20 hover:shadow-[0_0_16px_rgba(161,77,253,0.3)]"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  return null;
}
