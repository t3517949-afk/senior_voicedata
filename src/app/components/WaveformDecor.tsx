// Decorative waveform SVG element

interface WaveformDecorProps {
  bars?: number;
  color?: string;
  playing?: boolean;
  seed?: number;
  className?: string;
  height?: number;
}

function seededRandom(seed: number, index: number) {
  const x = Math.sin(seed * 9301 + index * 49297 + 233) * 93921;
  return x - Math.floor(x);
}

export function WaveformDecor({
  bars = 32,
  color = '#C07830',
  playing = false,
  seed = 42,
  className = '',
  height = 48,
}: WaveformDecorProps) {
  const barHeights = Array.from({ length: bars }, (_, i) => {
    const r = seededRandom(seed, i);
    const envelope = 1 - Math.pow((i / bars - 0.5) * 2, 4);
    return Math.max(3, Math.round(r * height * envelope));
  });

  return (
    <div
      className={`flex items-center gap-[2px] ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      {barHeights.map((h, i) => (
        <div
          key={i}
          className={playing ? 'wave-bar' : ''}
          style={{
            width: '3px',
            height: `${h}px`,
            backgroundColor: color,
            borderRadius: '2px',
            opacity: 0.75,
            animationDelay: playing ? `${(i * 0.04) % 1.2}s` : undefined,
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// Static waveform SVG for hero decoration
export function WaveformHero() {
  const points = [12, 18, 28, 42, 56, 64, 52, 38, 24, 46, 60, 72, 52, 38, 24, 42, 56, 64, 48, 34, 20, 38, 54, 66, 50, 36, 22, 40, 56, 68, 50, 36, 22, 14, 8];

  return (
    <svg
      viewBox={`0 0 ${points.length * 10} 80`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: '40px' }}
      aria-hidden="true"
    >
      {points.map((h, i) => (
        <rect
          key={i}
          x={i * 10 + 1}
          y={(80 - h) / 2}
          width={7}
          height={h}
          rx={3}
          fill="currentColor"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
