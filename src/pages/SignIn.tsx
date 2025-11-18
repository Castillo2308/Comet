import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [recoverMsg, setRecoverMsg] = useState('');
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await signIn(email, password);
      if (success) {
        navigate('/');
      } else {
        const pending = localStorage.getItem('pendingVerifyEmail');
        if (pending) {
          navigate('/verify-required');
          return;
        }
        setError('Credenciales inválidas');
        setFailCount(c => c + 1);
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Custom PWA install banner
  useEffect(() => {
    const onBIP = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  const triggerInstall = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return;
    setCanInstall(false);
    prompt.prompt();
    try {
      await prompt.userChoice;
    } finally {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full space-y-8 animate-fadeInUp">
        <div className="text-center">
          {/* COMET Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center p-4">
              <img src="/pwa-512x512.png" alt="COMET Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
          <p className="text-gray-600">Bienvenido, ingresa para continuar a tu cuenta</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Correo electrónico"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full pl-10 pr-10 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Contraseña"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Iniciando…' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-600">¿No tienes cuenta? </span>
            <Link
              to="/register"
              className="font-medium text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              Crea una
            </Link>
          </div>
        </form>

        {failCount >= 3 && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-xl text-sm">
            <div className="font-semibold mb-2">¿Olvidaste tu contraseña?</div>
            <div className="flex flex-col">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Tu correo"
              />
              <button
                onClick={async () => {
                  try {
                    setRecoverMsg('');
                    await fetch('/api/users/recover-request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    setRecoverMsg('Si existe una cuenta con ese correo, te enviaremos un enlace para restablecer la contraseña. El correo puede tardar unos minutos en aparecer en tu bandeja de entrada.');
                  } catch {}
                }}
                 className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 text-white"
              >
                Enviar enlace
              </button>
            </div>
            {recoverMsg && <div className="text-gray-700 mt-2">{recoverMsg}</div>}
            <div className="text-gray-600 mt-2">También puedes usar un enlace que te llegue a {email || 'tu correo'} y que abrirá la página de restablecer.</div>
          </div>
        )}

        {canInstall && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
            <div className="font-semibold text-blue-800 mb-1">Instala COMET</div>
            <div className="text-blue-700 mb-3">Instálala como app para acceder más rápido y usarla sin conexión.</div>
            <div className="flex gap-2 justify-center">
              <button onClick={triggerInstall} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Instalar</button>
              <button onClick={() => setCanInstall(false)} className="px-4 py-2 rounded-lg border">Ahora no</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}