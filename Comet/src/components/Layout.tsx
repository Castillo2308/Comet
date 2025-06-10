import React from 'react';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}