import { useStockStore } from '../../store/useStockStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function MovimentacaoChart() {
  const dados = useStockStore((s) => s.movimentacoesPorDia);

  if (dados.length === 0) {
    return (
      <div
        className="vs-card flex h-64 items-center justify-center"
        style={{ color: 'var(--vs-muted)' }}
      >
        <p className="text-sm">Sem movimentações nos últimos 30 dias</p>
      </div>
    );
  }

  return (
    <div className="vs-card p-5">
      <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>
        Movimentações — últimos 30 dias
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradEntrada" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSaida" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--vs-border)" />
          <XAxis
            dataKey="data"
            tickFormatter={formatDate}
            tick={{ fill: 'var(--vs-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--vs-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--vs-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', borderRadius: 6 }}
            labelStyle={{ color: 'var(--vs-orange)', fontSize: 12, marginBottom: 4 }}
            itemStyle={{ color: '#fff', fontSize: 12 }}
            labelFormatter={formatDate}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--vs-muted)' }} />
          <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#F97316" fill="url(#gradEntrada)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="saidas"   name="Saídas"   stroke="#EF4444" fill="url(#gradSaida)"  strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
