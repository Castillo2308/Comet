import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, Smartphone, Settings, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Load saved preferences
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedNotifications = localStorage.getItem('notificationsEnabled') !== 'false';
    
    setDarkMode(savedDarkMode);
    setNotificationsEnabled(savedNotifications);
    
    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Fetch unread notifications count if enabled
    if (savedNotifications && user?.cedula) {
      fetchUnreadCount();
    }
  }, [user?.cedula]);

  const fetchUnreadCount = async () => {
    setLoadingNotifications(true);
    try {
      const response = await api('/notifications/unread/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleNotificationsToggle = () => {
    const newNotifications = !notificationsEnabled;
    setNotificationsEnabled(newNotifications);
    localStorage.setItem('notificationsEnabled', newNotifications.toString());
    
    // Fetch unread count when enabling notifications
    if (newNotifications) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn shadow-2xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configuración</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Personaliza tu experiencia</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Settings Options */}
          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Modo Oscuro</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {darkMode ? 'Activado' : 'Desactivado'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notificationsEnabled ? (
                      <span>
                        Activas {loadingNotifications ? '(cargando...)' : unreadCount > 0 ? `(${unreadCount} nuevas)` : ''}
                      </span>
                    ) : (
                      'Desactivadas'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleNotificationsToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Admin Reports or Regular App Info */}
            {isAdmin ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Reportes del Sistema</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estadísticas y reportes</p>
                  </div>
                </div>
                <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                  <span className="text-sm font-medium">Ver</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                    <Smartphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Versión de la App</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">v1.0.0</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}