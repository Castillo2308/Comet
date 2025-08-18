import React, { useState } from 'react';
import { Users, FileText, AlertTriangle, Bus, Calendar, MessageSquare, BarChart3, Settings, Trash2, Edit, Eye, Plus, Search, Filter, Download, Upload, RefreshCw, TrendingUp, Activity, Bell, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Report {
  id: number;
  title: string;
  description: string;
  type: string;
  location: string;
  status: 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Rechazado';
  date: string;
  user: string;
  priority: 'Alta' | 'Media' | 'Baja';
  image?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'Activo' | 'Inactivo';
  joinDate: string;
  reportsCount: number;
  lastActivity: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  attendees: number;
  status: 'Programado' | 'En Curso' | 'Finalizado' | 'Cancelado';
  category: string;
  description: string;
}

const mockReports: Report[] = [
  {
    id: 1,
    title: 'Basura en las calles',
    description: 'Acumulación de basura en San Felipe',
    type: 'Limpieza',
    location: 'San Felipe',
    status: 'Pendiente',
    date: '2024-02-15',
    user: 'María González',
    priority: 'Alta',
    image: 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
  },
  {
    id: 2,
    title: 'Bache en la vía',
    description: 'Bache grande en la calle principal',
    type: 'Infraestructura',
    location: 'Centro',
    status: 'En Proceso',
    date: '2024-02-14',
    user: 'Carlos Rodríguez',
    priority: 'Media'
  },
  {
    id: 3,
    title: 'Semáforo dañado',
    description: 'Semáforo intermitente en intersección principal',
    type: 'Infraestructura',
    location: 'Avenida Central',
    status: 'Resuelto',
    date: '2024-02-13',
    user: 'Ana Jiménez',
    priority: 'Alta'
  }
];

const mockUsers: User[] = [
  {
    id: 1,
    name: 'María González',
    email: 'maria@email.com',
    role: 'user',
    status: 'Activo',
    joinDate: '2024-01-15',
    reportsCount: 5,
    lastActivity: 'hace 2 horas'
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    role: 'user',
    status: 'Activo',
    joinDate: '2024-01-20',
    reportsCount: 3,
    lastActivity: 'hace 1 día'
  },
  {
    id: 3,
    name: 'Ana Jiménez',
    email: 'ana@email.com',
    role: 'user',
    status: 'Inactivo',
    joinDate: '2024-01-10',
    reportsCount: 8,
    lastActivity: 'hace 1 semana'
  }
];

const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Feria de Emprendedores',
    date: '2024-02-20',
    location: 'Centro Comunal',
    attendees: 45,
    status: 'Programado',
    category: 'Comercio',
    description: 'Feria mensual de emprendedores locales'
  },
  {
    id: 2,
    title: 'Festival Cultural',
    date: '2024-02-25',
    location: 'Parque Central',
    attendees: 120,
    status: 'Programado',
    category: 'Cultural',
    description: 'Celebración de la cultura local'
  }
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const adminNavItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'events', icon: Calendar, label: 'Eventos' },
    { id: 'settings', icon: Settings, label: 'Config' }
  ];

  const handleUpdateReportStatus = (reportId: number, newStatus: Report['status']) => {
    setReports(reports.map(report =>
      report.id === reportId ? { ...report, status: newStatus } : report
    ));
  };

  const handleDeleteReport = (reportId: number) => {
    setReports(reports.filter(report => report.id !== reportId));
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const handleBulkAction = (action: string) => {
    if (action === 'delete') {
      if (activeTab === 'reports') {
        setReports(reports.filter(report => !selectedItems.includes(report.id)));
      } else if (activeTab === 'users') {
        setUsers(users.filter(user => !selectedItems.includes(user.id)));
      } else if (activeTab === 'events') {
        setEvents(events.filter(event => !selectedItems.includes(event.id)));
      }
      setSelectedItems([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'En Proceso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Resuelto': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rechazado': return 'bg-red-100 text-red-700 border-red-200';
      case 'Activo': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactivo': return 'bg-red-100 text-red-700 border-red-200';
      case 'Programado': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En Curso': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Finalizado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'Media': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Baja': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'Todos' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    {
      title: 'Total Reportes',
      value: reports.length,
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'blue',
      description: 'Reportes este mes'
    },
    {
      title: 'Usuarios Activos',
      value: users.filter(u => u.status === 'Activo').length,
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'green',
      description: 'Usuarios registrados'
    },
    {
      title: 'Eventos Programados',
      value: events.filter(e => e.status === 'Programado').length,
      change: '+3',
      trend: 'up',
      icon: Calendar,
      color: 'orange',
      description: 'Próximos eventos'
    },
    {
      title: 'Reportes Pendientes',
      value: reports.filter(r => r.status === 'Pendiente').length,
      change: '-5%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'red',
      description: 'Requieren atención'
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'from-green-500 to-green-600' :
                  stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-red-500 to-red-600'
                } p-3 rounded-xl shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mb-1">{stat.title}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart Placeholder */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Actividad del Sistema
          </h3>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200">
              7 días
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              30 días
            </button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-600 font-medium">Gráfico de actividad</p>
            <p className="text-blue-500 text-sm">Datos en tiempo real</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Actividad Reciente
          </h3>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Ver todo</button>
        </div>
        <div className="space-y-4">
          {reports.slice(0, 5).map((report, index) => (
            <div 
              key={report.id} 
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{report.title}</p>
                <p className="text-sm text-gray-600">Por {report.user} • {report.location}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Enhanced Header with Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Reportes</h2>
            <p className="text-gray-600">Administra y da seguimiento a todos los reportes ciudadanos</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reportes por título, usuario o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Resuelto">Resuelto</option>
            <option value="Rechazado">Rechazado</option>
          </select>
          {selectedItems.length > 0 && (
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Eliminar ({selectedItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Reports Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredReports.map(r => r.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reporte</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Prioridad</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report, index) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-gray-50 transition-colors duration-200 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(report.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, report.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== report.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-3">
                      {report.image && (
                        <img
                          src={report.image}
                          alt={report.title}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-xs font-medium text-gray-900">{report.title}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {report.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {report.user.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-900">{report.user}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateReportStatus(report.id, e.target.value as Report['status'])}
                      className={`px-3 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(report.status)}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="text-xs text-gray-900 flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      {report.date}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setEditingItem(report)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingItem(report)}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h2>
            <p className="text-gray-600">Administra los usuarios registrados en la plataforma</p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Reportes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Última Actividad</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 transition-colors duration-200 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-xs">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">Desde {user.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 hidden sm:table-cell">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-900">{user.reportsCount}</span>
                      <span className="text-xs text-gray-500">reportes</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 hidden lg:table-cell">{user.lastActivity}</td>
                  <td className="px-3 py-3">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setEditingItem(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 hover:bg-blue-50 rounded"
                        title="Ver perfil"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingItem(user)}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded"
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Eventos</h2>
            <p className="text-gray-600">Crea y administra eventos comunitarios</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <div 
            key={event.id}
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setEditingItem(event)}
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 hover:bg-blue-50 rounded"
                  title="Ver evento"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setEditingItem(event)}
                  className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded"
                  title="Editar evento"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded"
                  title="Eliminar evento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-gray-600 text-xs mb-3">{event.description}</p>
            
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-2" />
                {event.date}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2" />
                {event.location}
              </div>
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-2" />
                {event.attendees} asistentes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl">
        <div className="w-full px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-blue-100 text-sm">Bienvenido, {user?.name} • Sistema Comet</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg text-sm"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'dashboard' && 'Dashboard Principal'}
              {activeTab === 'reports' && 'Gestión de Reportes'}
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'events' && 'Gestión de Eventos'}
              {activeTab === 'settings' && 'Configuración del Sistema'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'dashboard' && 'Vista general del sistema y estadísticas'}
              {activeTab === 'reports' && 'Administra todos los reportes ciudadanos'}
              {activeTab === 'users' && 'Gestiona usuarios registrados'}
              {activeTab === 'events' && 'Crea y administra eventos comunitarios'}
              {activeTab === 'settings' && 'Configuración general del sistema'}
            </p>
          </div>
          
          <div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="text-center">
                  <Settings className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Sistema</h2>
                  <p className="text-gray-600 mb-6">Ajustes generales y configuración de la plataforma.</p>
                  <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
                    Abrir Configuración
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 shadow-lg">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          {adminNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-2 transition-all duration-300 transform ${
                  isActive
                    ? 'text-blue-500 scale-110'
                    : 'text-gray-400 hover:text-gray-600 hover:scale-105'
                }`}
              >
                <IconComponent className="h-5 w-5 mb-1 transition-transform duration-200" />
                <span className="text-xs font-medium transition-all duration-200">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}