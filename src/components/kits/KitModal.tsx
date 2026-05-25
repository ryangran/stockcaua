import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createKit } from '../../lib/api';
import { useStockStore } from '../../store/useStockStore';
import { Plus, Trash2 } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; onCreated: () => void; }

interface ItemForm { produto_id: string; quantidade: number }

export function KitModal({ open, onClose, onCreated }: Props) {
  const { produtos, upsertKit } = useStockStore();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([{ produto_id: '', quantidade: 1 }]);
  const [loading, setLoading] = useState(false);

  const inputStyle = { background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)', color: '#fff' };

  function addItem() { setItens((i) => [...i, { produto_id: '', quantidade: 1 }]); }
  function removeItem(idx: number) { setItens((i) => i.filter((_, j) => j !== idx)); }
  function updateItem(idx: number, key: keyof ItemForm, value: string | number) {
    setItens((i) => i.map((item, j) => j === idx ? { ...item, [key]: value } : item));
  }

  async function salvar() {
    if (!nome) { toast.error('Nome é obrigatório'); return; }
    const itensValidos = itens.filter((i) => i.produto_id && i.quantidade > 0);
    if (itensValidos.length === 0) { toast.error('Adicione ao menos um componente'); return; }

    setLoading(true);
    try {
      const kit = await createKit({ nome, descricao: descricao || undefined }, itensValidos);
      upsertKit(kit);
      toast.success('Kit criado');
      onCreated();
      onClose();
      setNome(''); setDescricao(''); setItens([{ produto_id: '', quantidade: 1 }]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar kit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent style={{ background: 'var(--vs-surface)', border: '1px solid var(--vs-border)', maxWidth: 520 }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vs-orange)' }}>Novo Kit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block" style={{ color: 'var(--vs-muted)' }}>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} style={inputStyle} placeholder="Opcional" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs" style={{ color: 'var(--vs-muted)' }}>Componentes</Label>
              <button onClick={addItem} className="text-xs flex items-center gap-1" style={{ color: 'var(--vs-orange)' }}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {itens.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={item.produto_id} onValueChange={(v) => updateItem(i, 'produto_id', v)}>
                    <SelectTrigger className="flex-1" style={{ ...inputStyle, minHeight: 36, fontSize: 13 }}>
                      <SelectValue placeholder="Produto..." />
                    </SelectTrigger>
                    <SelectContent style={{ background: 'var(--vs-surface-2)', border: '1px solid var(--vs-border)' }}>
                      {produtos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.codigo} — {p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min="1" value={item.quantidade}
                    onChange={(e) => updateItem(i, 'quantidade', parseFloat(e.target.value) || 1)}
                    style={{ ...inputStyle, width: 72 }}
                  />
                  <button onClick={() => removeItem(i)} style={{ color: 'var(--vs-red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={salvar} disabled={loading} style={{ background: 'var(--vs-orange)', color: '#000' }}>
            {loading ? 'Criando...' : 'Criar Kit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
