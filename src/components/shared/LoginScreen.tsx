import { useState, useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { useAuthStore } from '../../store/useAuthStore';

const BRAND_LINES = [
  '> Inicializando Visual Design OS...',
  '> Carregando módulos de controle...',
  '> Sistema pronto.',
];

export function LoginScreen({ onRegistro }: { onRegistro: () => void }) {
  const login = useAuthStore((s) => s.login);

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalDone, setTerminalDone] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Terminal boot lines
  useEffect(() => {
    let i = 0;
    const next = () => {
      if (i >= BRAND_LINES.length) { setTerminalDone(true); return; }
      setTerminalLines((prev) => [...prev, BRAND_LINES[i]]);
      i++;
      setTimeout(next, 480);
    };
    const t = setTimeout(next, 200);
    return () => clearTimeout(t);
  }, []);

  // Card entrance
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  function shake() {
    if (!shakeRef.current) return;
    gsap.fromTo(
      shakeRef.current,
      { x: 0 },
      { x: 12, duration: 0.07, repeat: 5, yoyo: true, ease: 'power1.inOut', onComplete: () => gsap.set(shakeRef.current, { x: 0 }) }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErro('');
    setLoading(true);

    try {
      const ok = await login(usuario, senha);
      if (ok === true) {
        gsap.to(cardRef.current, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in' });
      } else if (ok === 'pendente') {
        setErro('Acesso pendente de aprovação pelo administrador.');
        shake();
      } else {
        setErro('Usuário ou senha incorretos.');
        shake();
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido.');
      shake();
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: '#000', zIndex: 9999 }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Vignette corners */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none scanlines"
        style={{ opacity: 0.025 }}
      />

      <div ref={cardRef} style={{ opacity: 0, width: '100%', maxWidth: 420, padding: '0 16px' }}>
        {/* Logo */}
        <div className="mb-8 text-center">
          <p className="text-xs font-mono tracking-[0.3em] mb-1" style={{ color: 'var(--vs-muted)' }}>
            VISUAL STANDS DESIGN
          </p>
          <h1
            className="text-4xl font-black tracking-widest neon-text"
            style={{ color: 'var(--vs-orange)', letterSpacing: '0.15em' }}
          >
            STOCK OS
          </h1>
          <div className="mt-2 h-px mx-auto w-24" style={{ background: 'var(--vs-orange)', opacity: 0.4 }} />
        </div>

        {/* Terminal lines */}
        <div
          className="mb-6 rounded-md px-4 py-3 font-mono text-xs"
          style={{
            background: 'rgba(249,115,22,0.04)',
            border: '1px solid rgba(249,115,22,0.12)',
            minHeight: 72,
          }}
        >
          {terminalLines.map((line, i) => (
            <p key={i} style={{ color: i === terminalLines.length - 1 ? 'var(--vs-orange)' : 'var(--vs-muted)' }}>
              {line}
            </p>
          ))}
          {!terminalDone && (
            <span style={{ color: 'var(--vs-orange)' }} className="animate-pulse">█</span>
          )}
        </div>

        {/* Card */}
        <div
          ref={shakeRef}
          className="rounded-xl p-8"
          style={{
            background: 'var(--vs-surface)',
            border: '1px solid var(--vs-border)',
            boxShadow: '0 0 40px rgba(249,115,22,0.06)',
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Usuário */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--vs-muted)' }}>
                Usuário
              </label>
              <input
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => { setUsuario(e.target.value); setErro(''); }}
                placeholder="usuário"
                className="rounded-md px-3 py-2.5 text-sm font-mono outline-none transition-all"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid var(--vs-border)',
                  color: '#fff',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--vs-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--vs-border)')}
                required
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--vs-muted)' }}>
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(''); }}
                placeholder="••••••"
                className="rounded-md px-3 py-2.5 text-sm font-mono outline-none transition-all"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid var(--vs-border)',
                  color: '#fff',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--vs-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--vs-border)')}
                required
              />
            </div>

            {/* Erro */}
            {erro && (
              <p
                ref={errorRef}
                className="text-xs font-mono text-center py-1.5 rounded"
                style={{ color: 'var(--vs-red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                ✕ {erro}
              </p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md py-2.5 text-sm font-bold tracking-widest uppercase transition-all"
              style={{
                background: loading ? 'rgba(249,115,22,0.4)' : 'var(--vs-orange)',
                color: '#000',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.15em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full" />
                  Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <p className="text-xs font-mono" style={{ color: 'var(--vs-border)' }}>
            Visual Design © {new Date().getFullYear()}
          </p>
          <button
            onClick={onRegistro}
            className="text-xs font-mono underline transition-colors hover:opacity-80"
            style={{ color: 'var(--vs-muted)' }}
          >
            Solicitar acesso
          </button>
        </div>
      </div>
    </div>
  );
}
