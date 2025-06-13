import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Security from './pages/Security';
import Layout from './components/Layout';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const renderPageContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'announcements':
        return <Announcements />;
      case 'security':
        return <Security />;
      case 'chat':
        return <Dashboard />; // Placeholder for now
      case 'menu':
        return <Dashboard />; // Placeholder for now
      default:
        return <Dashboard />;
    }
  };

  return (
    <Routes>
      <Route 
        path="/signin" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignIn />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? (
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              {renderPageContent()}
            </Layout>
          ) : (
            <Navigate to="/signin" replace />
          )
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/signin"} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;