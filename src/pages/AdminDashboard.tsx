import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Calendar, BarChart3, Settings, Trash2, Edit, Plus, Search, Download, RefreshCw, TrendingUp, Activity, Clock, MapPin, Megaphone, Shield } from 'lucide-react';
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
  cedula?: string;
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
  const [complaints, setComplaints] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [dangerous, setDangerous] = useState<any[]>([]);
  const [hotspotComments, setHotspotComments] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Social',
    host: 'Municipalidad',
    price: '',
    attendants: 0,
  });
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsForm, setNewsForm] = useState({ type: '', title: '', description: '', insurgent: false });
  const [editingNews, setEditingNews] = useState<any>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<{ cedula?: string; name: string; lastname: string; email: string }>({ cedula: '', name: '', lastname: '', email: '' });
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState<{ type: string; title: string; description: string; location: string; status: string }>({ type: '', title: '', description: '', location: '', status: 'pending' });
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [hotspotModalOpen, setHotspotModalOpen] = useState(false);
  const [hotspotForm, setHotspotForm] = useState<{ title: string; description: string; date: string; time: string; dangerlevel: 'low' | 'medium' | 'high'; dangertime?: string }>({ title: '', description: '', date: '', time: '', dangerlevel: 'medium', dangertime: '' });
  const [editingHotspot, setEditingHotspot] = useState<any>(null);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);
  const [dangerForm, setDangerForm] = useState<{ title: string; description: string; location: string; date: string; dangerlevel: 'low' | 'medium' | 'high' }>({ title: '', description: '', location: '', date: '', dangerlevel: 'medium' });
  const [editingDanger, setEditingDanger] = useState<any>(null);
  const [securityNews, setSecurityNews] = useState<any[]>([]);
  const [securityNewsModalOpen, setSecurityNewsModalOpen] = useState(false);
  const [securityNewsForm, setSecurityNewsForm] = useState({ type: '', title: '', description: '', insurgent: false });
  const [editingSecurityNews, setEditingSecurityNews] = useState<any>(null);

  const adminNavItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'complaints', icon: AlertTriangle, label: 'Quejas' },
    { id: 'hotspots', icon: MapPin, label: 'Hotspots' },
    { id: 'dangerous', icon: AlertTriangle, label: 'Áreas Peligrosas' },
    { id: 'securityNews', icon: Shield, label: 'Noticias Seguridad' },
    { id: 'news', icon: Megaphone, label: 'Noticias' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'events', icon: Calendar, label: 'Eventos' },
    { id: 'settings', icon: Settings, label: 'Config' }
  ];

  const handleUpdateReportStatus = (reportId: number, newStatus: Report['status']) => {
    setReports(reports.map(report =>
      report.id === reportId ? { ...report, status: newStatus } : report
    ));
    // Persist to backend
    fetch(`/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus === 'Pendiente' ? 'pending' : newStatus })
    }).catch(()=>{});
  };

  const handleDeleteReport = (reportId: number) => {
    setReports(reports.filter(report => report.id !== reportId));
    // TODO: call DELETE /api/reports/:id when we add deletion in UI
  };

  const handleDeleteUser = async (cedula: string) => {
    if (!window.confirm('¿Eliminar este usuario y sus registros asociados?')) return;
    try { await fetch(`/api/users/${cedula}`, { method: 'DELETE' }); } catch {}
    setUsers(prev => prev.filter(u => (u.cedula || String(u.id)) !== cedula));
  };

  const handleDeleteComplaint = async (id: number) => {
    try { await fetch(`/api/complaints/${id}`, { method: 'DELETE' }); } catch {}
    setComplaints(prev => prev.filter((c:any) => c.id !== id));
  };

  const handleDeleteHotspot = async (id: string) => {
    try { await fetch(`/api/security/hotspots/${id}`, { method: 'DELETE' }); } catch {}
    setHotspots(prev => prev.filter((h:any) => (h._id || h.id) !== id));
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
    fetch(`/api/events/${eventId}`, { method: 'DELETE' }).catch(()=>{});
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
          <button onClick={() => { setUserForm({ cedula: '', name: '', lastname: '', email: '' }); setUserModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
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
                        onClick={() => { setUserForm({ cedula: user.cedula || String(user.id), name: (user.name || '').split(' ')[0] || '', lastname: (user.name || '').split(' ').slice(1).join(' ') || '', email: user.email }); setUserModalOpen(true); }}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded"
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.cedula || String(user.id))}
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

      {showCreateModal && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingItem ? 'Editar Evento' : 'Crear Evento'}</h3>
              <button onClick={() => { setShowCreateModal(false); setEditingItem(null); }} className="text-gray-500">×</button>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const isoDate = eventForm.date ? `${eventForm.date}T${eventForm.time || '00:00'}:00.000Z` : new Date().toISOString();
                const payload: any = {
                  type: eventForm.category,
                  title: eventForm.title,
                  description: eventForm.description,
                  date: isoDate,
                  location: eventForm.location,
                  attendants: Number(eventForm.attendants) || 0,
                  host: eventForm.host,
                  price: eventForm.price || null,
                  author: 'admin',
                };
                try {
                  if (editingItem) {
                    const res = await fetch(`/api/events/${editingItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (res.ok) {
                      const updated = await res.json();
                      setEvents(prev => prev.map(ev => ev.id === editingItem.id ? {
                        id: updated.id,
                        title: updated.title,
                        date: new Date(updated.date).toLocaleDateString('es-ES'),
                        location: updated.location,
                        attendees: Number(updated.attendants) || 0,
                        status: 'Programado',
                        category: updated.type || 'Social',
                        description: updated.description || ''
                      } : ev));
                    }
                  } else {
                    const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (res.ok) {
                      const created = await res.json();
                      const mapped = {
                        id: created.id,
                        title: created.title,
                        date: new Date(created.date).toLocaleDateString('es-ES'),
                        location: created.location,
                        attendees: Number(created.attendants) || 0,
                        status: 'Programado' as const,
                        category: created.type || 'Social',
                        description: created.description || ''
                      };
                      setEvents(prev => [mapped, ...prev]);
                    }
                  }
                } finally {
                  setShowCreateModal(false);
                  setEditingItem(null);
                  setEventForm({ title: '', description: '', date: '', time: '', location: '', category: 'Social', host: 'Municipalidad', price: '', attendants: 0 });
                }
              }}
            >
              <input value={eventForm.title} onChange={e=>setEventForm({...eventForm, title: e.target.value})} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={eventForm.description} onChange={e=>setEventForm({...eventForm, description: e.target.value})} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
              <div className="grid grid-cols-2 gap-2">
                <input value={eventForm.date} onChange={e=>setEventForm({...eventForm, date: e.target.value})} type="date" className="border rounded-lg px-3 py-2" required />
                <input value={eventForm.time} onChange={e=>setEventForm({...eventForm, time: e.target.value})} type="time" className="border rounded-lg px-3 py-2" />
              </div>
              <input value={eventForm.location} onChange={e=>setEventForm({...eventForm, location: e.target.value})} placeholder="Ubicación" className="w-full border rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <select value={eventForm.category} onChange={e=>setEventForm({...eventForm, category: e.target.value})} className="border rounded-lg px-3 py-2">
                  <option value="Social">Social</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Comercio">Comercio</option>
                  <option value="Educativo">Educativo</option>
                </select>
                <input value={eventForm.attendants} onChange={e=>setEventForm({...eventForm, attendants: Number(e.target.value)})} type="number" min={0} placeholder="Asistentes" className="border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={eventForm.host} onChange={e=>setEventForm({...eventForm, host: e.target.value})} placeholder="Organizador" className="border rounded-lg px-3 py-2" />
                <input value={eventForm.price} onChange={e=>setEventForm({...eventForm, price: e.target.value})} placeholder="Precio (opcional)" className="border rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>{ setShowCreateModal(false); setEditingItem(null); }} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingItem ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  onClick={() => { 
                    setEditingItem(event); 
                    setEventForm({
                      title: event.title,
                      description: event.description,
                      date: new Date(event.date).toISOString().slice(0,10),
                      time: '',
                      location: event.location,
                      category: event.category,
                      host: 'Municipalidad',
                      price: '',
                      attendants: event.attendees,
                    });
                    setShowCreateModal(true); 
                  }}
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

  // Initial data loads from backend
  useEffect(() => {
    // Users
    fetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const mapped: User[] = rows.map((u:any) => ({
            id: Number(u.cedula) || Math.floor(Math.random()*100000),
            cedula: String(u.cedula || ''),
            name: `${u.name} ${u.lastname}`,
            email: u.email,
            role: 'user',
            status: 'Activo',
            joinDate: new Date(u.created_at || Date.now()).toLocaleDateString('es-ES'),
            reportsCount: 0,
            lastActivity: 'hace poco'
          }));
          setUsers(mapped);
        }
      }).catch(()=>{});

    // Events
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const mapped: Event[] = rows.map((e:any) => ({
            id: e.id,
            title: e.title,
            date: new Date(e.date).toLocaleDateString('es-ES'),
            location: e.location,
            attendees: Number(e.attendants) || 0,
            status: 'Programado',
            category: e.type || 'Social',
            description: e.description || ''
          }));
          setEvents(mapped);
        }
      }).catch(()=>{});

    // Reports
    fetch('/api/reports')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const mapped: Report[] = rows.map((r:any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type || 'General',
            location: r.location || 'N/A',
            status: (r.status === 'pending' ? 'Pendiente' : r.status) as Report['status'],
            date: new Date(r.date).toLocaleDateString('es-ES'),
            user: r.author || 'Usuario',
            priority: 'Media',
            image: r.photo_link || undefined,
          }));
          setReports(mapped);
        }
      }).catch(()=>{});
    fetch('/api/news')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => { if (Array.isArray(rows)) setNewsItems(rows); })
      .catch(()=>{});

    // Complaints
    fetch('/api/complaints')
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => {
        if (Array.isArray(rows)) setComplaints(rows);
      }).catch(()=>{});

    // Hotspots + load comments per hotspot for admin view
    fetch('/api/security/hotspots')
      .then(r => r.ok ? r.json() : [])
      .then(async (rows:any[]) => {
        if (Array.isArray(rows)) {
          setHotspots(rows);
          const entries: Record<string, any[]> = {};
          for (const h of rows) {
            const id = (h._id || h.id);
            try {
              const cr = await fetch(`/api/security/hotspots/${id}/comments`);
              if (cr.ok) {
                entries[String(id)] = await cr.json();
              }
            } catch {}
          }
          setHotspotComments(entries);
        }
      })
      .catch(()=>{});

    // Dangerous Areas (Postgres)
    fetch('/api/dangerous-areas')
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => { if (Array.isArray(rows)) setDangerous(rows); })
      .catch(()=>{});

    // Security News
    fetch('/api/security-news')
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => { if (Array.isArray(rows)) setSecurityNews(rows); })
      .catch(()=>{});
  }, []);

  const renderNews = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Noticias</h2>
            <p className="text-gray-600">Publica anuncios municipales</p>
          </div>
          <button onClick={() => { setEditingNews(null); setNewsForm({ type: '', title: '', description: '', insurgent: false }); setNewsModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Noticia</span>
          </button>
        </div>
      </div>

      {newsModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingNews ? 'Editar Noticia' : 'Crear Noticia'}</h3>
              <button onClick={() => setNewsModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const payload = { type: newsForm.type, title: newsForm.title, description: newsForm.description, insurgent: !!newsForm.insurgent, date: new Date().toISOString(), author: 'admin' };
              if (editingNews) {
                const res = await fetch(`/api/news/${editingNews.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const updated = await res.json();
                  setNewsItems(prev => prev.map(n => n.id === editingNews.id ? updated : n));
                }
              } else {
                const res = await fetch('/api/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const created = await res.json();
                  setNewsItems(prev => [created, ...prev]);
                }
              }
              setNewsModalOpen(false);
              setEditingNews(null);
              setNewsForm({ type: '', title: '', description: '', insurgent: false });
            }}>
              <input value={newsForm.type} onChange={e => setNewsForm({ ...newsForm, type: e.target.value })} placeholder="Tipo" className="w-full border rounded-lg px-3 py-2" />
              <input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={newsForm.description} onChange={e => setNewsForm({ ...newsForm, description: e.target.value })} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!newsForm.insurgent} onChange={e=>setNewsForm({ ...newsForm, insurgent: e.target.checked })} /> Marcar como urgente</label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewsModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingNews ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y">
          {newsItems.map((n, idx) => (
            <div key={n.id ?? idx} className="p-4 flex items-start justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{n.type || 'General'}</span>
                  {n.insurgent ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Urgente</span> : null}
                  <span className="text-xs text-gray-500">{new Date(n.date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="font-semibold text-gray-900">{n.title}</div>
                <div className="text-xs text-gray-600">{n.description}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingNews(n); setNewsForm({ type: n.type || '', title: n.title || '', description: n.description || '', insurgent: !!n.insurgent }); setNewsModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={async () => { const res = await fetch(`/api/news/${n.id}`, { method: 'DELETE' }); if (res.ok) setNewsItems(prev => prev.filter(x => x.id !== n.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {newsItems.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No hay noticias aún.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDangerous = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Áreas Peligrosas</h2>
            <p className="text-gray-600">Gestiona zonas peligrosas reportadas por la municipalidad</p>
          </div>
          <button onClick={() => { setEditingDanger(null); setDangerForm({ title: '', description: '', location: '', date: '', dangerlevel: 'medium' }); setDangerModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Área</span>
          </button>
        </div>
      </div>

      {dangerModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingDanger ? 'Editar Área' : 'Crear Área'}</h3>
              <button onClick={() => setDangerModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const payload = { title: dangerForm.title, description: dangerForm.description, location: dangerForm.location, date: dangerForm.date ? new Date(dangerForm.date).toISOString() : new Date().toISOString(), dangerlevel: dangerForm.dangerlevel, author: 'admin' };
              if (editingDanger) {
                const res = await fetch(`/api/dangerous-areas/${editingDanger.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const updated = await res.json();
                  setDangerous(prev => prev.map(d => d.id === editingDanger.id ? updated : d));
                }
              } else {
                const res = await fetch('/api/dangerous-areas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const created = await res.json();
                  setDangerous(prev => [created, ...prev]);
                }
              }
              setDangerModalOpen(false);
              setEditingDanger(null);
              setDangerForm({ title: '', description: '', location: '', date: '', dangerlevel: 'medium' });
            }}>
              <input value={dangerForm.title} onChange={e=>setDangerForm({ ...dangerForm, title: e.target.value })} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={dangerForm.description} onChange={e=>setDangerForm({ ...dangerForm, description: e.target.value })} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
              <input value={dangerForm.location} onChange={e=>setDangerForm({ ...dangerForm, location: e.target.value })} placeholder="Ubicación" className="w-full border rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input value={dangerForm.date} onChange={e=>setDangerForm({ ...dangerForm, date: e.target.value })} type="date" className="border rounded-lg px-3 py-2" />
                <select value={dangerForm.dangerlevel} onChange={e=>setDangerForm({ ...dangerForm, dangerlevel: e.target.value as any })} className="border rounded-lg px-3 py-2">
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setDangerModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingDanger ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y">
          {dangerous.map((d:any, idx:number) => (
            <div key={d.id ?? idx} className="p-4 flex items-start justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{d.dangerlevel || 'medium'}</span>
                  <span className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="font-semibold text-gray-900">{d.title}</div>
                <div className="text-xs text-gray-600">{d.description}</div>
                {d.location && <div className="text-xs text-blue-600">{d.location}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingDanger(d); setDangerForm({ title: d.title || '', description: d.description || '', location: d.location || '', date: (d.date ? new Date(d.date).toISOString().slice(0,10) : ''), dangerlevel: (d.dangerlevel || 'medium') }); setDangerModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={async () => { const res = await fetch(`/api/dangerous-areas/${d.id}`, { method: 'DELETE' }); if (res.ok) setDangerous(prev => prev.filter(x => x.id !== d.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {dangerous.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No hay áreas peligrosas aún.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityNews = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Noticias de Seguridad</h2>
            <p className="text-gray-600">Publica anuncios relacionados a seguridad</p>
          </div>
          <button onClick={() => { setEditingSecurityNews(null); setSecurityNewsForm({ type: '', title: '', description: '', insurgent: false }); setSecurityNewsModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Noticia</span>
          </button>
        </div>
      </div>

      {securityNewsModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingSecurityNews ? 'Editar Noticia' : 'Crear Noticia'}</h3>
              <button onClick={() => setSecurityNewsModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const payload = { type: securityNewsForm.type, title: securityNewsForm.title, description: securityNewsForm.description, insurgent: !!securityNewsForm.insurgent, date: new Date().toISOString(), author: 'admin' };
              if (editingSecurityNews) {
                const res = await fetch(`/api/security-news/${editingSecurityNews.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const updated = await res.json();
                  setSecurityNews(prev => prev.map(n => n.id === editingSecurityNews.id ? updated : n));
                }
              } else {
                const res = await fetch('/api/security-news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const created = await res.json();
                  setSecurityNews(prev => [created, ...prev]);
                }
              }
              setSecurityNewsModalOpen(false);
              setEditingSecurityNews(null);
              setSecurityNewsForm({ type: '', title: '', description: '', insurgent: false });
            }}>
              <input value={securityNewsForm.type} onChange={e => setSecurityNewsForm({ ...securityNewsForm, type: e.target.value })} placeholder="Tipo" className="w-full border rounded-lg px-3 py-2" />
              <input value={securityNewsForm.title} onChange={e => setSecurityNewsForm({ ...securityNewsForm, title: e.target.value })} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={securityNewsForm.description} onChange={e => setSecurityNewsForm({ ...securityNewsForm, description: e.target.value })} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!securityNewsForm.insurgent} onChange={e=>setSecurityNewsForm({ ...securityNewsForm, insurgent: e.target.checked })} /> Marcar como urgente</label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSecurityNewsModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingSecurityNews ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y">
          {securityNews.map((n, idx) => (
            <div key={n.id ?? idx} className="p-4 flex items-start justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{n.type || 'General'}</span>
                  {n.insurgent ? <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">Urgente</span> : null}
                  <span className="text-xs text-gray-500">{new Date(n.date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="font-semibold text-gray-900">{n.title}</div>
                <div className="text-xs text-gray-600">{n.description}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingSecurityNews(n); setSecurityNewsForm({ type: n.type || '', title: n.title || '', description: n.description || '', insurgent: !!n.insurgent }); setSecurityNewsModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={async () => { const res = await fetch(`/api/security-news/${n.id}`, { method: 'DELETE' }); if (res.ok) setSecurityNews(prev => prev.filter(x => x.id !== n.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {securityNews.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No hay noticias de seguridad aún.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsersModal = () => (
    userModalOpen && (
      <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
        <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{userForm.cedula ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <button onClick={() => setUserModalOpen(false)} className="text-gray-500">×</button>
          </div>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            if (!userForm.cedula) return; // Only edit for now
            const payload:any = { name: userForm.name, lastname: userForm.lastname, email: userForm.email };
            const res = await fetch(`/api/users/${userForm.cedula}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
              setUsers(prev => prev.map(u => (u.cedula === userForm.cedula) ? { ...u, name: `${userForm.name} ${userForm.lastname}`, email: userForm.email } : u));
            }
            setUserModalOpen(false);
          }}>
            <input value={userForm.cedula} readOnly placeholder="Cédula" className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
            <input value={userForm.name} onChange={e=>setUserForm({ ...userForm, name: e.target.value })} placeholder="Nombre" className="w-full border rounded-lg px-3 py-2" required />
            <input value={userForm.lastname} onChange={e=>setUserForm({ ...userForm, lastname: e.target.value })} placeholder="Apellido" className="w-full border rounded-lg px-3 py-2" required />
            <input value={userForm.email} onChange={e=>setUserForm({ ...userForm, email: e.target.value })} type="email" placeholder="Email" className="w-full border rounded-lg px-3 py-2" required />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={()=>setUserModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
              <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderComplaints = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Quejas</h2>
            <p className="text-gray-600">Revisa y actualiza las quejas de seguridad</p>
          </div>
          <button onClick={() => { setEditingComplaint(null); setComplaintForm({ type: '', title: '', description: '', location: '', status: 'pending' }); setComplaintModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Queja</span>
          </button>
        </div>
      </div>

      {complaintModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingComplaint ? 'Editar Queja' : 'Crear Queja'}</h3>
              <button onClick={() => setComplaintModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              const payload = { ...complaintForm, date: new Date().toISOString(), author: 'admin' };
              if (editingComplaint) {
                const res = await fetch(`/api/complaints/${editingComplaint.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) { const up = await res.json(); setComplaints(prev => prev.map((c:any) => c.id === editingComplaint.id ? up : c)); }
              } else {
                const res = await fetch('/api/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) { const created = await res.json(); setComplaints(prev => [created, ...prev]); }
              }
              setComplaintModalOpen(false); setEditingComplaint(null); setComplaintForm({ type: '', title: '', description: '', location: '', status: 'pending' });
            }}>
              <input value={complaintForm.title} onChange={e=>setComplaintForm({ ...complaintForm, title: e.target.value })} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={complaintForm.description} onChange={e=>setComplaintForm({ ...complaintForm, description: e.target.value })} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
              <div className="grid grid-cols-2 gap-2">
                <input value={complaintForm.type} onChange={e=>setComplaintForm({ ...complaintForm, type: e.target.value })} placeholder="Tipo" className="border rounded-lg px-3 py-2" />
                <input value={complaintForm.location} onChange={e=>setComplaintForm({ ...complaintForm, location: e.target.value })} placeholder="Ubicación" className="border rounded-lg px-3 py-2" />
              </div>
              <select value={complaintForm.status} onChange={e=>setComplaintForm({ ...complaintForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="pending">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Resuelto">Resuelto</option>
                <option value="Rechazado">Rechazado</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setComplaintModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingComplaint ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y">
          {complaints.map((c:any, idx:number) => (
            <div key={c.id ?? idx} className="p-4 flex items-start justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{c.type || 'General'}</span>
                  <span className="text-xs text-gray-500">{new Date(c.date).toLocaleDateString('es-ES')}</span>
                  {c.author && <span className="text-xs text-gray-400">por {c.author}</span>}
                </div>
                <div className="font-semibold text-gray-900">{c.title}</div>
                <div className="text-xs text-gray-600">{c.description}</div>
                <div className="text-[11px] text-gray-500 mt-1">{c.location}</div>
              </div>
              <div className="flex gap-1 items-center">
                <select defaultValue={c.status} onChange={async (e)=>{ const nv = e.target.value; const res = await fetch(`/api/complaints/${c.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: nv }) }); if (res.ok) setComplaints(prev => prev.map((x:any)=> x.id===c.id ? { ...x, status: nv } : x)); }} className="text-xs border rounded px-2 py-1">
                  <option value="pending">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
                <button onClick={() => { setEditingComplaint(c); setComplaintForm({ type: c.type || '', title: c.title || '', description: c.description || '', location: c.location || '', status: c.status || 'pending' }); setComplaintModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteComplaint(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No hay quejas aún.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHotspots = () => {
    const toRiskPill = (lvl:string) => lvl==='high' ? 'bg-red-100 text-red-700' : lvl==='medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Hotspots</h2>
              <p className="text-gray-600">Crea y administra zonas peligrosas</p>
            </div>
            <button onClick={() => { setEditingHotspot(null); setHotspotForm({ title: '', description: '', date: '', time: '', dangerlevel: 'medium', dangertime: '' }); setHotspotModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo Hotspot</span>
            </button>
          </div>
        </div>

        {hotspotModalOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{editingHotspot ? 'Editar Hotspot' : 'Crear Hotspot'}</h3>
                <button onClick={() => setHotspotModalOpen(false)} className="text-gray-500">×</button>
              </div>
              <form className="space-y-3" onSubmit={async (e) => {
                e.preventDefault();
                const isoDate = hotspotForm.date ? `${hotspotForm.date}T${hotspotForm.time || '00:00'}:00.000Z` : new Date().toISOString();
                const payload:any = { title: hotspotForm.title, description: hotspotForm.description, date: isoDate, dangerlevel: hotspotForm.dangerlevel, dangertime: hotspotForm.dangertime, author: 'admin' };
                if (editingHotspot) {
                  const id = editingHotspot._id || editingHotspot.id;
                  const res = await fetch(`/api/security/hotspots/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) {
                    const updated = await res.json();
                    setHotspots(prev => prev.map((h:any) => ((h._id||h.id) === id ? updated : h)));
                  }
                } else {
                  const res = await fetch('/api/security/hotspots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) { const created = await res.json(); setHotspots(prev => [created, ...prev]); }
                }
                setHotspotModalOpen(false); setEditingHotspot(null); setHotspotForm({ title: '', description: '', date: '', time: '', dangerlevel: 'medium', dangertime: '' });
              }}>
                <input value={hotspotForm.title} onChange={e=>setHotspotForm({ ...hotspotForm, title: e.target.value })} placeholder="Título" className="w-full border rounded-lg px-3 py-2" required />
                <textarea value={hotspotForm.description} onChange={e=>setHotspotForm({ ...hotspotForm, description: e.target.value })} placeholder="Descripción" className="w-full border rounded-lg px-3 py-2" rows={3} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={hotspotForm.date} onChange={e=>setHotspotForm({ ...hotspotForm, date: e.target.value })} type="date" className="border rounded-lg px-3 py-2" required />
                  <input value={hotspotForm.time} onChange={e=>setHotspotForm({ ...hotspotForm, time: e.target.value })} type="time" className="border rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={hotspotForm.dangerlevel} onChange={e=>setHotspotForm({ ...hotspotForm, dangerlevel: e.target.value as any })} className="border rounded-lg px-3 py-2">
                    <option value="low">Bajo</option>
                    <option value="medium">Medio</option>
                    <option value="high">Alto</option>
                  </select>
                  <input value={hotspotForm.dangertime} onChange={e=>setHotspotForm({ ...hotspotForm, dangertime: e.target.value })} placeholder="Franja horaria (opcional)" className="border rounded-lg px-3 py-2" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>setHotspotModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                  <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingHotspot ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotspots.map((h:any, index:number) => {
            const id = h._id || h.id;
            const title = h.title || 'Zona';
            const description = h.description || '';
            const date = new Date(h.date).toLocaleDateString('es-ES');
            const level = (h.dangerLevel || h.dangerlevel || 'medium').toLowerCase();
            return (
              <div key={String(id)} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${toRiskPill(level)}`}>{level === 'high' ? 'Alto' : level === 'medium' ? 'Medio' : 'Bajo'}</span>
                  <div className="flex space-x-1">
                    <button onClick={() => { setEditingHotspot(h); setHotspotForm({ title, description, date: new Date(h.date).toISOString().slice(0,10), time: '', dangerlevel: level as any, dangertime: h.dangerTime || h.dangertime || '' }); setHotspotModalOpen(true); }} className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded" title="Editar">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteHotspot(String(id))} className="text-red-600 hover:text-red-800 transition-colors duration-200 p-1 hover:bg-red-50 rounded" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-600 text-xs mb-2">{description}</p>
                <div className="text-xs text-gray-500">{date}</div>
                  {/* Admin-only comments visibility */}
                  <div className="mt-3 border-t pt-2">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Comentarios</div>
                    {Array.isArray(hotspotComments[String(id)]) && hotspotComments[String(id)].length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-auto pr-1">
                        {hotspotComments[String(id)].map((c:any) => (
                          <div key={String(c._id || c.id)} className="text-[12px] text-gray-700">
                            <span className="font-medium text-gray-900">{c.author || 'anon'}:</span> {c.content}
                            <span className="text-gray-400 ml-2">{new Date(c.date).toLocaleString('es-ES')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[12px] text-gray-400">Sin comentarios</div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
              {activeTab === 'complaints' && 'Gestión de Quejas'}
              {activeTab === 'hotspots' && 'Gestión de Hotspots'}
              {activeTab === 'dangerous' && 'Áreas Peligrosas'}
              {activeTab === 'securityNews' && 'Noticias de Seguridad'}
              {activeTab === 'news' && 'Gestión de Noticias'}
              {activeTab === 'events' && 'Gestión de Eventos'}
              {activeTab === 'settings' && 'Configuración del Sistema'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'dashboard' && 'Vista general del sistema y estadísticas'}
              {activeTab === 'reports' && 'Administra todos los reportes ciudadanos'}
              {activeTab === 'users' && 'Gestiona usuarios registrados'}
              {activeTab === 'complaints' && 'Administra y da seguimiento a quejas de seguridad'}
              {activeTab === 'hotspots' && 'Crea y administra zonas peligrosas'}
              {activeTab === 'dangerous' && 'Gestiona zonas peligrosas (fuente municipal)'}
              {activeTab === 'securityNews' && 'Publica anuncios de seguridad'}
              {activeTab === 'events' && 'Crea y administra eventos comunitarios'}
              {activeTab === 'settings' && 'Configuración general del sistema'}
            </p>
          </div>
          
          <div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'news' && renderNews()}
            {activeTab === 'dangerous' && renderDangerous()}
            {activeTab === 'securityNews' && renderSecurityNews()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'complaints' && renderComplaints()}
            {activeTab === 'hotspots' && renderHotspots()}
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
      {renderUsersModal()}
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