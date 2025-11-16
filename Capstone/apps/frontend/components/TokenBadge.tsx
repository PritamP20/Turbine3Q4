'use client';

interface TokenBadgeProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TokenBadge({ symbol, size = 'md', showLabel = false }: TokenBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full ${sizeClasses[size]} shadow-lg`}>
      <span className={iconSizes[size]}>🪙</span>
      <span>${symbol}</span>
      {showLabel && size !== 'sm' && (
        <span className="text-xs opacity-90 ml-1">Token</span>
      )}
    </div>
  );
}
