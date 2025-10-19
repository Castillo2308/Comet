import { useState } from 'react';
import { Home, Megaphone, Plus, Info, MoreHorizontal, Calendar, Users, Bus, MapPin, ArrowLeft } from 'lucide-react';
import ReportModal from './ReportModal';
import SideMenu from './SideMenu';
import SettingsModal from './SettingsModal';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReportSubmit?: (report: any) => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onReportSubmit }: BottomNavigationProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAnnouncementsSubmenu, setShowAnnouncementsSubmenu] = useState(false);
  const [showInfoSubmenu, setShowInfoSubmenu] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'announcements', icon: Megaphone, label: 'Anuncios', hasSubmenu: true },
    { id: 'report', icon: Plus, label: 'Reportar', isCenter: true },
    { id: 'info', icon: Info, label: 'Información', hasSubmenu: true },
    { id: 'menu', icon: MoreHorizontal, label: 'Menú' },
  ];

  const announcementsSubmenuItems = [
    { id: 'events', icon: Calendar, label: 'Eventos', action: () => onTabChange('events') },
    { id: 'community', icon: Users, label: 'Comunidad', action: () => onTabChange('community') }
  ];

  const infoSubmenuItems = [
    { id: 'security', icon: Users, label: 'Seguridad', action: () => onTabChange('security') },
    { id: 'buses', icon: Bus, label: 'Buses', action: () => onTabChange('buses') },
    { id: 'redpoints', icon: MapPin, label: 'Puntos Rojos', action: () => onTabChange('redpoints') }
  ];

  const handleTabClick = (tabId: string, hasSubmenu?: boolean) => {
    if (tabId === 'report') {
      setShowReportModal(true);
    } else if (tabId === 'menu') {
      setShowSideMenu(true);
    } else if (tabId === 'announcements' && hasSubmenu) {
      setShowAnnouncementsSubmenu(true);
      setShowInfoSubmenu(false);
    } else if (tabId === 'info' && hasSubmenu) {
      setShowInfoSubmenu(true);
      setShowAnnouncementsSubmenu(false);
    } else {
      onTabChange(tabId);
      setShowAnnouncementsSubmenu(false);
      setShowInfoSubmenu(false);
    }
  };

  const handleSubmenuItemClick = (action: () => void) => {
    action();
    setShowAnnouncementsSubmenu(false);
    setShowInfoSubmenu(false);
  };

  const handleBackClick = () => {
    setShowAnnouncementsSubmenu(false);
    setShowInfoSubmenu(false);
  };

  const handleReportSubmit = (report: any) => {
    if (onReportSubmit) {
      onReportSubmit(report);
    }
  };

  const renderNormalNavigation = () => (
    <nav className="flex items-center justify-around w-full max-w-lg mx-auto sm:max-w-3xl px-2">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        const isCenter = item.isCenter;
        
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id, item.hasSubmenu)}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-300 transform group ${
              isCenter
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 -mt-6 sm:-mt-8 shadow-2xl hover:from-blue-600 hover:to-blue-700 hover:scale-110 active:scale-95 border-4 border-white'
                : isActive
                ? 'text-blue-500 scale-110 bg-blue-50 rounded-xl px-3 py-2'
                : 'text-gray-400 hover:text-blue-500 hover:scale-105 hover:bg-gray-50 rounded-xl px-3 py-2'
            }`}
          >
            <IconComponent 
              className={`${isCenter ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-5 w-5 sm:h-6 sm:w-6'} ${isCenter ? '' : 'mb-1'} transition-all duration-200 ${!isCenter ? 'group-hover:scale-110' : ''}`} 
            />
            {!isCenter && (
              <span className="text-xs sm:text-sm font-semibold transition-all duration-200 group-hover:text-blue-600">{item.label}</span>
            )}
            {isActive && !isCenter && (
              <div className="absolute -bottom-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderSubmenuNavigation = (submenuItems: any[], title?: string) => (
    <nav className="flex items-center justify-between w-full max-w-lg mx-auto sm:max-w-3xl px-4">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="flex flex-col items-center justify-center p-3 sm:p-4 text-gray-400 hover:text-blue-500 hover:scale-105 transition-all duration-300 transform hover:bg-gray-50 rounded-xl"
      >
        <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
        <span className="text-xs sm:text-sm font-semibold">Atrás</span>
      </button>

      {/* Submenu items */}
      <div className="flex items-center justify-center space-x-6 sm:space-x-10 flex-1">
        {submenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSubmenuItemClick(item.action)}
              className="flex flex-col items-center justify-center p-3 sm:p-4 text-gray-600 hover:text-blue-500 hover:scale-110 transition-all duration-300 transform active:scale-95 group hover:bg-blue-50 rounded-xl"
            >
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200 p-3 sm:p-4 rounded-2xl mb-2 transition-all duration-200 shadow-sm group-hover:shadow-md">
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <span className="text-xs sm:text-sm font-semibold group-hover:text-blue-600 transition-colors duration-200">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Placeholder for balance */}
      <div className="w-16 sm:w-20"></div>
    </nav>
  );

  return (
    <>
      <ReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
      />

      <SideMenu 
        isOpen={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      {/* Bottom Navigation - Fixed for iPhone safe area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 z-30 shadow-2xl">
        <div className="pb-safe">
          {showAnnouncementsSubmenu ? (
            <div className="transform transition-all duration-500 animate-slideInRight">
              {renderSubmenuNavigation(announcementsSubmenuItems)}
            </div>
          ) : showInfoSubmenu ? (
            <div className="transform transition-all duration-500 animate-slideInRight">
              {renderSubmenuNavigation(infoSubmenuItems)}
              {renderSubmenuNavigation(announcementsSubmenuItems, 'Anuncios')}
            </div>
          ) : showInfoSubmenu ? (
            <div className="transform transition-all duration-500 animate-slideInRight">
              {renderSubmenuNavigation(infoSubmenuItems, 'Información')}
            </div>
          ) : (
            <div className="transform transition-all duration-500">
              {renderNormalNavigation()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}