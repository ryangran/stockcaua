import { useEffect } from 'react';
import { parsearPaste } from '../lib/api';
import { useStockStore } from '../store/useStockStore';

export function usePaste(ativo = true) {
  const { produtos, setPasteRows, setPasteModalAberto } = useStockStore();

  useEffect(() => {
    if (!ativo) return;

    const handler = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (!text.includes('\n') && !text.includes('\t') && !text.includes(';')) return;

      e.preventDefault();
      const rows = await parsearPaste(text, produtos);
      if (rows.length === 0) return;

      setPasteRows(rows);
      setPasteModalAberto(true);
    };

    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [ativo, produtos, setPasteRows, setPasteModalAberto]);
}
