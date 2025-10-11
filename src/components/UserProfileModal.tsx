import React, { useState, useEffect } from 'react';
import { X, User, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, signOut, updateProfile, deleteAccount } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    password: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, lastname: user.lastname, email: user.email, password: '' });
      setError(null);
      setSuccess(null);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const updates: any = { name: formData.name, lastname: formData.lastname, email: formData.email };
    if (formData.password.trim()) updates.password = formData.password.trim();
    const ok = await updateProfile(updates);
    setSaving(false);
    if (ok) {
      setSuccess('Perfil actualizado');
      setFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => { onClose(); }, 700);
    } else {
      setError('No se pudo actualizar el perfil.');
    }
  };

  const handleLogout = () => {
    signOut();
    onClose();
  };

  const handleDelete = async () => {
    const ok = await deleteAccount();
    if (ok) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-sm transform transition-all duration-300 animate-scaleIn">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Profile Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <User className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.name} {user?.lastname}</h3>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              logout &gt;
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Modificar el nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Modificar el apellido"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Modificar el email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                placeholder="Nueva contraseña (opcional)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Modificar'}
            </button>
          </form>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 py-3 px-4 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>

          {/* Delete Account */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full mt-3 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Eliminar cuenta</span>
          </button>

          {confirmDelete && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
                <p className="text-sm text-gray-600 mb-4">Esta acción no se puede deshacer. ¿Deseas eliminar tu cuenta?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                  <button onClick={handleDelete} className="px-3 py-2 rounded-lg bg-red-600 text-white">Eliminar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}