interface PresenceCursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
}

const PresenceCursor = ({ x, y, name, color }: PresenceCursorProps) => (
  <div
    className="pointer-events-none fixed z-[9999] transition-all duration-75"
    style={{ left: x, top: y }}
  >
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <path d="M0 0L16 12H6L0 20V0Z" fill={color} />
    </svg>
    <span
      className="absolute left-4 top-3 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  </div>
);

export default PresenceCursor;
