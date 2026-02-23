interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  className,
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <h2
        className={`text-3xl md:text-4xl font-bold mb-3 text-center text-foreground ${titleClassName ?? ''}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-center text-muted-foreground mb-12 max-w-xl mx-auto ${subtitleClassName ?? ''}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
