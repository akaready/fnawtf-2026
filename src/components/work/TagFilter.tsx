'use client';

interface TagFilterProps {
  label: string;
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export function TagFilter({
  label,
  tags,
  selectedTags,
  onToggle,
}: TagFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isActive = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-accent text-accent-foreground shadow-lg scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }
              `}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
