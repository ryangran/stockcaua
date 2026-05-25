import { useRef, useEffect } from 'react';
import { gsap } from '../../lib/gsap';
import { useStockStore } from '../../store/useStockStore';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtR$ = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function StatsCards() {
  const stats = useStockStore((s) => s.dashboardStats);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.from(containerRef.current!.children, {
      opacity: 0, y: 24, stagger: 0.08, duration: 0.45, ease: 'power2.out',
    });
  }, []);

  const cards = [
    {
      label: 'Total de SKUs',
      value: fmt(stats.total_skus),
      icon: Package,
      color: 'var(--vs-orange)',
    },
    {
      label: 'Valor em Estoque',
      value: fmtR$(stats.valor_total_estoque),
      icon: DollarSign,
      color: '#22C55E',
    },
    {
      label: 'Itens Críticos',
      value: fmt(stats.itens_criticos),
      icon: AlertTriangle,
      color: 'var(--vs-red)',
    },
    {
      label: 'Giro Médio (30d)',
      value: fmt(stats.giro_medio, 1),
      icon: TrendingUp,
      color: 'var(--vs-orange)',
    },
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="vs-card group relative overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-1"
          onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2 })}
          onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
        >
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(ellipse at top left, ${color}10, transparent 70%)` }}
          />
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--vs-muted)' }}>
              {label}
            </span>
            <div className="rounded-md p-1.5" style={{ background: `${color}15` }}>
              <Icon size={14} style={{ color }} />
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
