import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CreditCard, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    cedula: '',
    email: '',
    password: ''
  });
  const [pwViolations, setPwViolations] = useState<string[]>([]);
  const [pwTouched, setPwTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dupError, setDupError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const v: string[] = [];
    const minLen = 12;
    if (password.length < minLen) v.push(`Al menos ${minLen} caracteres.`);
    if (password.length > 128) v.push('No más de 128 caracteres.');
    if (!/[a-z]/.test(password)) v.push('Incluye una letra minúscula.');
    if (!/[A-Z]/.test(password)) v.push('Incluye una letra mayúscula.');
    if (!/\d/.test(password)) v.push('Incluye un número.');
    if (!/[^A-Za-z0-9\s]/.test(password)) v.push('Incluye un carácter especial.');
    if (/\s/.test(password)) v.push('No debe tener espacios.');
    if (/(.)\1\1/.test(password)) v.push('Evita 3+ caracteres repetidos.');
    const digits = password.replace(/\D+/g, '');
    for (let i = 0; i <= digits.length - 4; i++) {
      const chunk = digits.slice(i, i + 4);
      if ('0123456789'.includes(chunk) || '9876543210'.includes(chunk)) { v.push('Evita secuencias como 1234 o 4321.'); break; }
    }
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'password') {
      setPwViolations(validatePassword(e.target.value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDupError('');

    try {
      const success = await signUp(
        formData.name,
        formData.lastname,
        formData.cedula,
        formData.email,
        formData.password
      );
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Error al crear la cuenta');
      }
    } catch (err) {
      const msg = (err as Error)?.message || '';
      if (msg.includes('cédula') || msg.toLowerCase().includes('cedula')) setDupError('Esta cédula ya está registrada.');
      else if (msg.toLowerCase().includes('email')) setDupError('Este email ya está registrado.');
      else setError('Error al registrarse');
    } finally {
      setLoading(false);
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
          <p className="text-gray-600">Crea tu cuenta para empezar a comunicarte directamente con tu cantón</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}
          {dupError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
              {dupError}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Nombre"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="lastname"
                required
                value={formData.lastname}
                onChange={handleChange}
                className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Apellidos"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="cedula"
                required
                value={formData.cedula}
                onChange={handleChange}
                className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Ingresa Cédula"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full pl-10 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                onBlur={() => setPwTouched(true)}
                className="appearance-none relative block w-full pl-3 pr-3 py-4 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                placeholder="Ingresa tu contraseña"
              />
              {(pwTouched || formData.password) && (
                <div className="mt-2 text-xs">
                  <div className={`h-1 rounded ${pwViolations.length === 0 && formData.password.length >= 12 ? 'bg-green-500' : pwViolations.length <= 2 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {[
                      'Al menos 12 caracteres.',
                      'Incluye una letra minúscula.',
                      'Incluye una letra mayúscula.',
                      'Incluye un número.',
                      'Incluye un carácter especial.',
                      'No debe tener espacios.',
                      'Evita 3+ caracteres repetidos.',
                      'Evita secuencias como 1234 o 4321.'
                    ].map(req => (
                      <li key={req} className={`flex items-center gap-2 ${pwViolations.includes(req) ? 'text-gray-500' : 'text-green-600'}`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${pwViolations.includes(req) ? 'bg-gray-300' : 'bg-green-500'}`}></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || pwViolations.length > 0}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Registrando...' : 'Regístrate'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <Link
              to="/signin"
              className="font-medium text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}