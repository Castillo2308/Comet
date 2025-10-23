import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DriverServiceProvider } from './context/DriverServiceContext';
import SignIn from './pages/SignIn';
import VerifyRequired from './pages/VerifyRequired';
import Verified from './pages/Verified';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Announcements from './pages/Announcements';
import Security from './pages/Security';
import Buses from './pages/Buses';
import Community from './pages/Community';
import Events from './pages/Events';
import RedPoints from './pages/RedPoints';
import Layout from './components/Layout';
import { startServiceWorkerNewsChecks, stopServiceWorkerNewsChecks } from './lib/swClient';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Start SW-based news checks for all authenticated users (including admin)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const token = localStorage.getItem('authToken') || undefined;
      if (isAuthenticated && user) {
        startServiceWorkerNewsChecks(token, 60_000).catch(() => {});
      } else {
        stopServiceWorkerNewsChecks().catch(() => {});
      }
    }
  }, [isAuthenticated, user?.role]);

  // If user is staff (any non-user role except driver), show admin interface
  if (isAuthenticated && user && user.role !== 'user' && user.role !== 'driver') {
    return (
      <Routes>
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    );
  }

  const renderPageContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'announcements':
        return <Announcements />;
      case 'security':
        return <Security />;
      case 'buses':
        return <Buses />;
      case 'community':
        return <Community />;
      case 'events':
        return <Events />;
      case 'redpoints':
        return <RedPoints />;
      case 'info':
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
      <Route path="/verify-required" element={<VerifyRequired />} />
  <Route path="/verified" element={<Verified />} />
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
        <DriverServiceProvider>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </DriverServiceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;