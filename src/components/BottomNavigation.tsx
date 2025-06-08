import React, { useState, useRef } from 'react';
import { Home, Megaphone, Plus, MessageCircle, MoreHorizontal, Calendar, Bell, Users, Shield, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';
import CircularMenu from './CircularMenu';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementsMenu, setShowAnnouncementsMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const { user } = useAuth();

  const announcementsRef = useRef<HTMLButtonElement>(null);
  const chatRef = useRef<HTMLButtonElement>(null);

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'announcements', icon: Megaphone, label: 'Anuncios', hasMenu: true },
    { id: 'report', icon: Plus, label: 'Reportar', isCenter: true },
    { id: 'chat', icon: MessageCircle, label: 'Chat', hasMenu: true },
    { id: 'menu', icon: MoreHorizontal, label: 'Menú' },
  ];

  const announcementsMenuItems = [
    {
      id: 'events',
      icon: Calendar,
      label: 'Eventos',
      onClick: () => console.log('Eventos clicked')
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notificaciones',
      onClick: () => console.log('Notificaciones clicked')
    },
    {
      id: 'community',
      icon: Users,
      label: 'Comunidad',
      onClick: () => console.log('Comunidad clicked')
    }
  ];

  const chatMenuItems = [
    {
      id: 'security',
      icon: Shield,
      label: 'Seguridad',
      onClick: () => onTabChange('security')
    },
    {
      id: 'emergency',
      icon: Phone,
      label: 'Emergencia',
      onClick: () => console.log('Emergencia clicked')
    }
  ];

  const handleTabClick = (tabId: string, hasMenu?: boolean) => {
    if (tabId === 'report') {
      setShowReportModal(true);
    } else if (tabId === 'announcements' && hasMenu) {
      setShowAnnouncementsMenu(!showAnnouncementsMenu);
      setShowChatMenu(false);
    } else if (tabId === 'chat' && hasMenu) {
      setShowChatMenu(!showChatMenu);
      setShowAnnouncementsMenu(false);
    } else {
      onTabChange(tabId);
      setShowAnnouncementsMenu(false);
      setShowChatMenu(false);
    }
  };

  const handleMouseEnter = (tabId: string, hasMenu?: boolean) => {
    if (tabId === 'announcements' && hasMenu) {
      setShowAnnouncementsMenu(true);
      setShowChatMenu(false);
    } else if (tabId === 'chat' && hasMenu) {
      setShowChatMenu(true);
      setShowAnnouncementsMenu(false);
    }
  };

  const handleMouseLeave = () => {
    // Don't close immediately to allow hovering over menu items
    setTimeout(() => {
      setShowAnnouncementsMenu(false);
      setShowChatMenu(false);
    }, 200);
  };

  return (
    <>
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />

      <CircularMenu
        items={announcementsMenuItems}
        isOpen={showAnnouncementsMenu}
        onClose={() => setShowAnnouncementsMenu(false)}
        triggerRef={announcementsRef}
      />

      <CircularMenu
        items={chatMenuItems}
        isOpen={showChatMenu}
        onClose={() => setShowChatMenu(false)}
        triggerRef={chatRef}
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 z-30 shadow-lg">
        <nav className="flex items-center justify-around">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const isCenter = item.isCenter;
            
            return (
              <button
                key={item.id}
                ref={item.id === 'announcements' ? announcementsRef : item.id === 'chat' ? chatRef : null}
                onClick={() => handleTabClick(item.id, item.hasMenu)}
                onMouseEnter={() => handleMouseEnter(item.id, item.hasMenu)}
                onMouseLeave={handleMouseLeave}
                className={`flex flex-col items-center justify-center p-2 transition-all duration-300 transform ${
                  isCenter
                    ? 'bg-blue-500 text-white rounded-full w-14 h-14 -mt-6 shadow-xl hover:bg-blue-600 hover:scale-110 active:scale-95'
                    : isActive
                    ? 'text-blue-500 scale-110'
                    : 'text-gray-400 hover:text-gray-600 hover:scale-105'
                }`}
              >
                <IconComponent 
                  className={`${isCenter ? 'h-6 w-6' : 'h-5 w-5'} mb-1 transition-transform duration-200`} 
                />
                {!isCenter && (
                  <span className="text-xs font-medium transition-all duration-200">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}