import React from 'react';
import { X, HelpCircle, MessageSquare, Bot, Settings, Info, Phone, Mail } from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function SideMenu({ isOpen, onClose, onOpenSettings }: SideMenuProps) {

  const menuItems = [
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Ayuda y Soporte',
      description: 'Encuentra respuestas a tus preguntas',
      action: () => console.log('Ayuda clicked')
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      label: 'WhatsApp',
      description: 'Contacta por WhatsApp',
      action: () => window.open('https://wa.me/50612345678', '_blank')
    },
    {
      id: 'chatbot',
      icon: Bot,
      label: 'Asistente Virtual',
      description: 'Próximamente disponible',
      action: () => console.log('Chatbot clicked'),
      isComingSoon: true
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Configuración',
      description: 'Ajusta tus preferencias',
      action: () => {
        onOpenSettings();
        onClose();
      }
    },
    {
      id: 'about',
      icon: Info,
      label: 'Acerca de',
      description: 'Información sobre la app',
      action: () => console.log('About clicked')
    },
    {
      id: 'contact',
      icon: Phone,
      label: 'Contacto',
      description: 'Información de contacto',
      action: () => console.log('Contact clicked')
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out animate-slideInRight">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600">
            <div>
              <h2 className="text-lg font-bold text-white">Menú</h2>
              <p className="text-blue-100 text-sm">Opciones y configuración</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      if (!item.isComingSoon) {
                        onClose();
                      }
                    }}
                    disabled={item.isComingSoon}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left ${
                      item.isComingSoon
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-50 hover:shadow-sm active:scale-98'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      item.isComingSoon 
                        ? 'bg-gray-200' 
                        : 'bg-gradient-to-br from-blue-100 to-purple-100'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        item.isComingSoon 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold text-sm ${
                          item.isComingSoon ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {item.label}
                        </h3>
                        {item.isComingSoon && (
                          <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${
                        item.isComingSoon ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Comet App</h3>
              <p className="text-gray-600 text-xs mb-2">Versión 1.0.0</p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <button className="hover:text-blue-500 transition-colors duration-200">
                  Términos
                </button>
                <span>•</span>
                <button className="hover:text-blue-500 transition-colors duration-200">
                  Privacidad
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}