import React, { useState } from 'react';
import BottomNavigation from './BottomNavigation';
import ChatbotToggle from './ChatbotToggle';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [reports, setReports] = useState<any[]>([]);
  const { user } = useAuth();

  const handleReportSubmit = (report: any) => {
    setReports(prev => [report, ...prev]);
    
    // Store in localStorage to persist across page refreshes
    const existingReports = JSON.parse(localStorage.getItem('userReports') || '[]');
    const updatedReports = [report, ...existingReports];
    localStorage.setItem('userReports', JSON.stringify(updatedReports));
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative overflow-hidden transition-colors duration-200">
      <main className="flex-1 overflow-hidden">
        {React.cloneElement(children as React.ReactElement, { userReports: reports, onTabChange })}
      </main>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        onReportSubmit={handleReportSubmit}
      />
      {/* Show chatbot toggle only for regular users (not admin) */}
      {user && user.role !== 'admin' && <ChatbotToggle />}
    </div>
  );
}