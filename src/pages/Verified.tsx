import { useEffect, useRef, useState } from 'react';

export default function Verified() {
  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');
  const ranRef = useRef(false); // Avoid double-run in React 18 StrictMode

  useEffect(() => {
    if (ranRef.current) return; // prevent second invocation
    ranRef.current = true;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token') || '';
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/users/verify?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error('Fallo en la verificación');
        setStatus('ok');
        setMessage('Tu cuenta fue verificada con éxito.');
        // Clear any pending email marker
        localStorage.removeItem('pendingVerifyEmail');
      } catch (e) {
        // If we already marked success (race or duplicate), don't downgrade UI
        setStatus((prev) => (prev === 'ok' ? 'ok' : 'error'));
        setMessage((prev) => (prev === 'Tu cuenta fue verificada con éxito.' ? prev : 'El enlace es inválido o ha expirado.'));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full space-y-6 text-center bg-white p-8 rounded-2xl shadow-xl">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto bg-blue-100 animate-pulse" />
            <h1 className="text-2xl font-bold">Verificando…</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status !== 'loading' && (
          <>
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${status === 'ok' ? 'bg-green-100' : 'bg-red-100'}`}>
              {status === 'ok' ? (
                <span className="text-green-600 text-4xl">✓</span>
              ) : (
                <span className="text-red-600 text-4xl">!</span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{status === 'ok' ? '¡Cuenta verificada!' : 'No se pudo verificar'}</h1>
            <p className="text-gray-600">{message}</p>
            {status === 'ok' ? (
              <>
                <p className="text-gray-500 text-sm">Puedes cerrar la app y volver a abrirla para ingresar a COMET.</p>
                <a href="/signin" className="inline-block mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white">Ir a Iniciar sesión</a>
              </>
            ) : (
              <a href="/verify-required" className="inline-block px-4 py-2 rounded-lg border">Regresar</a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
