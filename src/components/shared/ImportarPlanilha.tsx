import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { useStockStore } from '../../store/useStockStore';
import { parsearLinhasImport } from '../../lib/api';

export function ImportarPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { produtos, setPasteRows, setPasteModalAberto } = useStockStore();
  const [carregando, setCarregando] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCarregando(true);

    try {
      const buffer = await file.arrayBuffer();

      // Import dinâmico para evitar problemas no SSR (Cloudflare Workers)
      const { read, utils } = await import('xlsx');

      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Converte para array de arrays de strings (raw: false formata números/datas)
      const dados = utils.sheet_to_json<string[]>(ws, {
        header: 1,
        raw: false,
        defval: '',
      }) as string[][];

      if (!dados.length) {
        toast.error('Planilha vazia ou sem dados');
        return;
      }

      const rows = await parsearLinhasImport(dados, produtos);

      if (!rows.length) {
        toast.error('Nenhuma linha válida encontrada na planilha');
        return;
      }

      setPasteRows(rows);
      setPasteModalAberto(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Erro ao ler arquivo');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.ods"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={carregando}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
        style={{
          border: '1px solid var(--vs-border)',
          color: carregando ? 'var(--vs-border)' : 'var(--vs-muted)',
          cursor: carregando ? 'not-allowed' : 'pointer',
        }}
        title="Importar planilha (.xlsx, .xls, .csv)"
      >
        {carregando
          ? <Loader2 size={13} className="animate-spin" style={{ color: 'var(--vs-orange)' }} />
          : <Upload size={13} style={{ color: 'var(--vs-orange)' }} />
        }
        {carregando ? 'Lendo...' : 'Importar planilha'}
      </button>
    </>
  );
}
