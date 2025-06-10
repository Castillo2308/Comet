import React, { useState, useRef } from 'react';
import { Home, Megaphone, Plus, MessageCircle, MoreHorizontal, Calendar, Bell, Users, Shield, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementsSubmenu, setShowAnnouncementsSubmenu] = useState(false);
  const [showChatSubmenu, setShowChatSubmenu] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'announcements', icon: Megaphone, label: 'Anuncios', hasSubmenu: true },
    { id: 'report', icon: Plus, label: 'Reportar', isCenter: true },
    { id: 'chat', icon: MessageCircle, label: 'Chat', hasSubmenu: true },
    { id: 'menu', icon: MoreHorizontal, label: 'Menú' },
  ];

  const announcementsSubmenuItems = [
    { id: 'events', icon: Calendar, label: 'Eventos', action: () => console.log('Eventos clicked') },
    { id: 'notifications', icon: Bell, label: 'Notificaciones', action: () => console.log('Notificaciones clicked') },
    { id: 'community', icon: Users, label: 'Comunidad', action: () => console.log('Comunidad clicked') }
  ];

  const chatSubmenuItems = [
    { id: 'security', icon: Shield, label: 'Seguridad', action: () => onTabChange('security') },
    { id: 'emergency', icon: Phone, label: 'Emergencia', action: () => console.log('Emergencia clicked') }
  ];

  const handleTabClick = (tabId: string, hasSubmenu?: boolean) => {
    if (tabId === 'report') {
      setShowReportModal(true);
    } else if (tabId === 'announcements' && hasSubmenu) {
      setShowAnnouncementsSubmenu(true);
      setShowChatSubmenu(false);
    } else if (tabId === 'chat' && hasSubmenu) {
      setShowChatSubmenu(true);
      setShowAnnouncementsSubmenu(false);
    } else {
      onTabChange(tabId);
      setShowAnnouncementsSubmenu(false);
      setShowChatSubmenu(false);
    }
  };

  const handleSubmenuItemClick = (action: () => void) => {
    action();
    setShowAnnouncementsSubmenu(false);
    setShowChatSubmenu(false);
  };

  const handleBackClick = () => {
    setShowAnnouncementsSubmenu(false);
    setShowChatSubmenu(false);
  };

  const renderNormalNavigation = () => (
    <nav className="flex items-center justify-around w-full max-w-md mx-auto sm:max-w-2xl">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        const isCenter = item.isCenter;
        
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id, item.hasSubmenu)}
            className={`flex flex-col items-center justify-center p-2 sm:p-3 transition-all duration-300 transform ${
              isCenter
                ? 'bg-blue-500 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 -mt-4 sm:-mt-6 shadow-xl hover:bg-blue-600 hover:scale-110 active:scale-95'
                : isActive
                ? 'text-blue-500 scale-110'
                : 'text-gray-400 hover:text-gray-600 hover:scale-105'
            }`}
          >
            <IconComponent 
              className={`${isCenter ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4 sm:h-5 sm:w-5'} ${isCenter ? '' : 'mb-1'} transition-transform duration-200`} 
            />
            {!isCenter && (
              <span className="text-xs sm:text-sm font-medium transition-all duration-200">{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderSubmenuNavigation = (submenuItems: any[], title: string) => (
    <nav className="flex items-center justify-between w-full max-w-md mx-auto sm:max-w-2xl px-4">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="flex flex-col items-center justify-center p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:scale-105 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
        <span className="text-xs sm:text-sm font-medium">Atrás</span>
      </button>

      {/* Submenu items */}
      <div className="flex items-center justify-center space-x-4 sm:space-x-8 flex-1">
        {submenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSubmenuItemClick(item.action)}
              className="flex flex-col items-center justify-center p-2 sm:p-3 text-gray-600 hover:text-blue-500 hover:scale-110 transition-all duration-300 transform active:scale-95"
            >
              <div className="bg-gray-100 hover:bg-blue-100 p-2 sm:p-3 rounded-full mb-1 transition-colors duration-200">
                <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Placeholder for balance */}
      <div className="w-12 sm:w-16"></div>
    </nav>
  );

  return (
    <>
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 sm:px-4 py-2 sm:py-3 z-30 shadow-lg safe-area-bottom">
        {showAnnouncementsSubmenu ? (
          <div className="transform transition-all duration-300 animate-slideInRight">
            {renderSubmenuNavigation(announcementsSubmenuItems, 'Anuncios')}
          </div>
        ) : showChatSubmenu ? (
          <div className="transform transition-all duration-300 animate-slideInRight">
            {renderSubmenuNavigation(chatSubmenuItems, 'Chat')}
          </div>
        ) : (
          <div className="transform transition-all duration-300">
            {renderNormalNavigation()}
          </div>
        )}
      </div>
    </>
  );
}