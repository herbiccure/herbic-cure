import React from 'react';
import { generateCode128Bars } from '@/lib/shipping/barcode';

interface BarcodeSvgProps {
  value: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
}

export function BarcodeSvg({
  value,
  height = 50,
  moduleWidth = 1.8,
  showText = true,
  className = '',
}: BarcodeSvgProps) {
  const { bars, totalWidth } = generateCode128Bars(value, {
    height,
    moduleWidth,
    quietZone: 8,
  });

  if (bars.length === 0) {
    return null;
  }

  const svgHeight = showText ? height + 18 : height;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${svgHeight}`}
        width="100%"
        height={svgHeight}
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full"
        style={{ display: 'block' }}
      >
        <g fill="#000000">
          {bars.map((b, idx) => (
            <rect
              key={idx}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
            />
          ))}
        </g>
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 14}
            textAnchor="middle"
            fontFamily="monospace, Courier New, monospace"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="2"
            fill="#000000"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}

