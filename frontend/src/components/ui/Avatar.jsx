/**
 * Avatar Component
 * Shows profile photo if available, otherwise shows colored initials.
 */
export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
    '3xl': 'w-28 h-28 text-2xl',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Generate a deterministic pastel color from the name
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length || 0;
  const bgColor = colors[colorIndex];

  const sizeClass = sizes[size] || sizes.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {initials || '?'}
    </div>
  );
}
