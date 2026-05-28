import { useRef, useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { gsap } from '../../lib/gsap';
import { useStockStore } from '../../store/useStockStore';
import {
  LayoutDashboard, Package, ShoppingCart, Layers,
  RotateCcw, ArrowLeftRight, AlertTriangle, Menu, X,
} from 'lucide-react';

const NAV = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produtos',       icon: Package,         label: 'Produtos' },
  { to: '/compras',        icon: ShoppingCart,     label: 'Compras' },
  { to: '/kits',           icon: Layers,           label: 'Kits' },
  { to: '/movimentacoes',  icon: ArrowLeftRight,   label: 'Movimentações' },
  { to: '/retornos',       icon: RotateCcw,        label: 'Retornos' },
  { to: '/necessidades',   icon: AlertTriangle,    label: 'Necessidades' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const necessidades = useStockStore((s) => s.necessidades);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(sidebarRef.current, {
      width: collapsed ? 64 : 220,
      duration: 0.3,
      ease: 'power2.inOut',
    });
  }, [collapsed]);

  return (
    <div
      ref={sidebarRef}
      className="relative flex h-screen flex-col overflow-hidden shrink-0"
      style={{
        width: collapsed ? 64 : 220,
        background: 'var(--vs-surface)',
        borderRight: '1px solid var(--vs-border)',
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <div className="flex h-14 items-center justify-between px-3 shrink-0" style={{ borderBottom: '1px solid var(--vs-border)' }}>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="whitespace-nowrap text-sm font-black tracking-wide" style={{ color: 'var(--vs-orange)' }}>
              VISUAL DESIGN
            </div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--vs-muted)' }}>
              Stock OS
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto rounded-md p-1.5 transition-colors hover:bg-white/5"
          style={{ color: 'var(--vs-muted)' }}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-all duration-200"
              style={{
                background: active ? 'var(--vs-orange-glow, rgba(249,115,22,0.12))' : 'transparent',
                color: active ? 'var(--vs-orange)' : 'var(--vs-muted)',
                borderLeft: active ? '2px solid var(--vs-orange)' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) gsap.to(e.currentTarget, { x: 3, duration: 0.15 });
              }}
              onMouseLeave={(e) => {
                if (!active) gsap.to(e.currentTarget, { x: 0, duration: 0.15 });
              }}
            >
              <div className="relative shrink-0">
                <Icon size={17} />
                {label === 'Necessidades' && necessidades.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 size-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--vs-red)', color: '#fff' }}
                  >
                    {necessidades.length > 9 ? '9+' : necessidades.length}
                  </span>
                )}
              </div>
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--vs-border)', color: 'var(--vs-muted)', fontSize: 10 }}>
          <div className="font-mono">v1.0.0 — 2026</div>
        </div>
      )}
    </div>
  );
}
