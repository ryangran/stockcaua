import { useStockStore } from '../../store/useStockStore';

export function TerminalCounter() {
  const terminais = useStockStore((s) => s.terminaisAtivos);
  const count = terminais.length;

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--vs-muted)]">
      <span
        className="size-2 rounded-full animate-pulse"
        style={{ background: count > 1 ? 'var(--vs-orange)' : '#22C55E' }}
      />
      <span>
        {count} terminal{count !== 1 ? 'is' : ''} ativo{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
