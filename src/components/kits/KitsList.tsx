import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { ProducaoModal } from './ProducaoModal';
import { deleteKit } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { Layers, Trash2, Play, Plus } from 'lucide-react';
import { KitModal } from './KitModal';
import type { Kit } from '../../types';

export function KitsList({ onProducao }: { onProducao: () => void }) {
  const { kits, removeKit } = useStockStore();
  const [producaoKit, setProducaoKit] = useState<Kit | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);

  async function excluir(kit: Kit) {
    if (!confirm(`Excluir kit "${kit.nome}"?`)) return;
    try {
      await deleteKit(kit.id);
      removeKit(kit.id);
      toast.success('Kit excluído');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--vs-orange)' }}>
          Kits cadastrados ({kits.length})
        </h3>
        <Button onClick={() => setNovoOpen(true)} size="sm" style={{ background: 'var(--vs-orange)', color: '#000' }}>
          <Plus size={13} className="mr-1.5" /> Novo Kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <div className="vs-card flex flex-col items-center justify-center py-14 gap-3">
          <Layers size={32} style={{ color: 'var(--vs-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--vs-muted)' }}>Nenhum kit cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <div key={kit.id} className="vs-card p-5 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm">{kit.nome}</h4>
                  {kit.descricao && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--vs-muted)' }}>{kit.descricao}</p>
                  )}
                </div>
                <button onClick={() => excluir(kit)} className="p-1 rounded" style={{ color: 'var(--vs-muted)' }}>
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Componentes */}
              <div className="space-y-1">
                {(kit.itens ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs"
                    style={{ color: 'var(--vs-muted)' }}>
                    <span className="truncate max-w-[160px]">{item.produto?.nome ?? item.produto_id}</span>
                    <span className="font-mono ml-2 shrink-0" style={{ color: '#fff' }}>
                      ×{item.quantidade} {item.produto?.unidade}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setProducaoKit(kit)}
                size="sm"
                className="w-full mt-auto"
                style={{ background: 'var(--vs-orange)', color: '#000' }}
              >
                <Play size={13} className="mr-1.5" /> Produzir
              </Button>
            </div>
          ))}
        </div>
      )}

      <KitModal open={novoOpen} onClose={() => setNovoOpen(false)} onCreated={onProducao} />

      {producaoKit && (
        <ProducaoModal
          open
          onClose={() => setProducaoKit(null)}
          kit={producaoKit}
          onSuccess={onProducao}
        />
      )}
    </div>
  );
}
