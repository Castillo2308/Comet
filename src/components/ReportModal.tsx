import React, { useState } from 'react';
import { X, Megaphone, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (report: any) => void;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    file: null as File | null
  });

  const reportTypes = [
    'Basura en las calles',
    'Problemas de alumbrado',
    'Baches en la vía',
    'Problemas de agua',
    'Ruido excesivo',
    'Otro'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let photo_link: string | null = null;
    if (formData.file) {
      // Keep it simple: convert to base64 (small images recommended)
      const file = formData.file;
      photo_link = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const payload = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: new Date().toISOString(),
      status: 'pending',
      photo_link,
      author: user?.cedula || 'anon',
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        const mapped = {
          id: created.id,
          title: created.title,
          description: created.description,
          type: created.type,
          location: created.location,
          status: created.status === 'pending' ? 'Pendiente' : created.status,
          date: new Date(created.date).toLocaleString('es-ES'),
          image: created.photo_link || undefined,
          priority: 'Media',
          author: created.author || user?.cedula || 'anon'
        };
        onSubmit?.(mapped);
        onClose();
        setFormData({ title: '', description: '', type: '', location: '', file: null });
      }
    } catch {
      // swallow; could add toast
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fadeIn">
      <div 
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-slideUp"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-in'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Megaphone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">¡Reporta un problema!</h2>
                <p className="text-sm text-gray-600">¡Trabajemos juntos por una mejor comunidad!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50"
                required
              />
            </div>

            <div>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                required
              >
                <option value="">Selecciona el tipo de reporte</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="Ubicación"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors duration-200 cursor-pointer bg-gray-50">
                <Upload className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {formData.file ? formData.file.name : 'Choose File No file selected'}
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}