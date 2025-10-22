import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Calendar, BarChart3, Settings, Trash2, Edit, Plus, Search, Download, RefreshCw, Activity, Clock, MapPin, Megaphone, Shield, MessageSquare, Bus, Navigation, Check, Image as ImageIcon } from 'lucide-react';
import  HotspotsMap  from '../components/HotspotsMap';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

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
  photoLink?: string;
}

interface User {
  id: number;
  cedula?: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'security' | 'news' | 'reports' | 'buses' | 'driver' | 'community';
  verified?: boolean;
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
  const [complaintForm, setComplaintForm] = useState<{ type: string; title: string; description: string; location: string; status: string }>({ type: '', title: '', description: '', location: '', status: 'Pendiente' });
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
  // Comunidad (admin only)
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [editingCommunityPost, setEditingCommunityPost] = useState<any>(null);
  const [communityForm, setCommunityForm] = useState<{ content: string; photo_link?: string } >({ content: '', photo_link: '' });
  const [communityComments, setCommunityComments] = useState<Record<string, any[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  // Reload community posts (admin)
  const refreshCommunity = async () => {
    setCommunityLoading(true);
    try {
      const r = await fetch('/api/forum', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } });
      const rows = r.ok ? await r.json() : [];
      const toPreview = (url?: string) => {
        if (!url) return undefined;
        try {
          const raw = String(url);
          if (/\/file\/d\//.test(raw) && /\/preview(\?|$)/.test(raw)) return raw;
          const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
          let id = m?.[1];
          if (!id) { try { const u = new URL(raw); id = u.searchParams.get('id') || undefined; } catch {} }
          return id ? `https://drive.google.com/file/d/${id}/preview` : raw;
        } catch { return url; }
      };
      const posts = (Array.isArray(rows) ? rows : []).map((p:any) => ({ ...p, photo_link: toPreview(p.photo_link) }));
      setCommunityPosts(posts);
    } catch {
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
    }
  };
  // Administrators/Users management state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEditingUser, setAdminEditingUser] = useState<any>(null);
  const [adminForm, setAdminForm] = useState<{ cedula: string; name: string; lastname: string; email: string; password: string; role: User['role'] }>({ cedula: '', name: '', lastname: '', email: '', password: '', role: 'user' });
  // Buses admin state
  const [adminBuses, setAdminBuses] = useState<any[]>([]);
  const [busesFilter, setBusesFilter] = useState<string>('Todos');
  const [busesLoading, setBusesLoading] = useState(false);
  const [busCenterId, setBusCenterId] = useState<string | null>(null);

  const adminNavItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Inicio' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'complaints', icon: AlertTriangle, label: 'Quejas' },
    { id: 'hotspots', icon: MapPin, label: 'Puntos Rojos' },
    { id: 'dangerous', icon: AlertTriangle, label: 'Áreas Peligrosas' },
    { id: 'securityNews', icon: Shield, label: 'Noticias Seguridad' },
    { id: 'news', icon: Megaphone, label: 'Noticias' },
    { id: 'buses', icon: Bus, label: 'Buses' },
  { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'community', icon: MessageSquare, label: 'Comunidad' },
    { id: 'events', icon: Calendar, label: 'Eventos' },
    { id: 'settings', icon: Settings, label: 'Config' }
  ];

  const role = user?.role || 'user';
  const visibleTabs = adminNavItems.filter(item => {
    if (role === 'admin') return true;
    if (role === 'security') return ['dashboard','complaints','hotspots','dangerous','securityNews'].includes(item.id);
    if (role === 'news') return ['dashboard','news','events'].includes(item.id);
    if (role === 'reports') return ['dashboard','reports'].includes(item.id);
    if (role === 'buses') return ['dashboard','buses'].includes(item.id);
    if (role === 'community') return ['dashboard','community'].includes(item.id);
    return false; // users shouldn't see AdminDashboard tabs
  });

  const handleUpdateReportStatus = async (reportId: number, newStatus: Report['status']) => {
    // Optimistic UI update
    const prev = reports;
    setReports(prev.map(report => (report.id === reportId ? { ...report, status: newStatus } : report)));
    try {
      await api(`/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      // rollback on failure
      setReports(prev);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    const prev = reports;
    setReports(prev.filter(report => report.id !== reportId));
    try { await api(`/reports/${reportId}`, { method: 'DELETE' }); } catch { setReports(prev); }
  };

  const handleDeleteUser = async (cedula: string) => {
    if (!window.confirm('¿Eliminar este usuario y sus registros asociados?')) return;
  try { await api(`/users/${cedula}`, { method: 'DELETE' }); } catch {}
    setUsers(prev => prev.filter(u => (u.cedula || String(u.id)) !== cedula));
  };

  const handleDeleteComplaint = async (id: number) => {
  try { await api(`/complaints/${id}`, { method: 'DELETE' }); } catch {}
    setComplaints(prev => prev.filter((c:any) => c.id !== id));
  };

  const handleDeleteHotspot = async (id: string) => {
  try { await api(`/security/hotspots/${id}`, { method: 'DELETE' }); } catch {}
    setHotspots(prev => prev.filter((h:any) => (h._id || h.id) !== id));
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
  api(`/events/${eventId}`, { method: 'DELETE' }).catch(()=>{});
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
              <div className="flex items-center justify-start mb-4">
                <div className={`bg-gradient-to-r ${
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'from-green-500 to-green-600' :
                  stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-red-500 to-red-600'
                } p-3 rounded-xl shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
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

      {/* Nuevo evento (replaces activity chart) */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-blue-600" />
            Nuevo evento
          </h3>
        </div>
        {events && events.length > 0 ? (
          (() => {
            const parseDateVal = (d: string) => {
              // Try Date.parse first
              const direct = Date.parse(d);
              if (!isNaN(direct)) return direct;
              // Fallback for es-ES dd/mm/yyyy
              const m = String(d).match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
              if (m) {
                const dd = parseInt(m[1], 10);
                const mm = parseInt(m[2], 10) - 1;
                const yyyy = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10);
                return new Date(yyyy, mm, dd).valueOf();
              }
              return 0;
            };
            const latest = [...events].sort((a, b) => parseDateVal(b.date) - parseDateVal(a.date))[0];
            return (
              <div className="rounded-xl border border-gray-100 p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-start justify-between">
                  <div className="pr-4">
                    <div className="text-sm text-gray-500 mb-1">{latest.category || 'Evento'}</div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">{latest.title}</div>
                    {latest.description && (
                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">{latest.description}</div>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="inline-flex items-center bg-gray-50 px-2 py-1 rounded">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-blue-600" /> {latest.date}
                      </span>
                      {latest.location && (
                        <span className="inline-flex items-center bg-gray-50 px-2 py-1 rounded">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-blue-600" /> {latest.location}
                        </span>
                      )}
                      <span className="inline-flex items-center bg-gray-50 px-2 py-1 rounded">
                        <Users className="h-3.5 w-3.5 mr-1 text-blue-600" /> {latest.attendees} asistentes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="h-24 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-500 text-sm">
            No hay eventos registrados aún.
          </div>
        )}
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
                      {report.photoLink ? (
                        <a
                          href={report.photoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 border"
                          title="Abrir imagen en nueva pestaña"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </a>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-gray-900 flex items-center gap-2">
                          <span>{report.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center"><MapPin className="h-3 w-3 mr-1" />{report.location}</span>
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
            <p className="text-gray-600">Crea usuarios y edita su información</p>
          </div>
          <button
            onClick={() => { setAdminEditingUser(null); setAdminForm({ cedula: '', name: '', lastname: '', email: '', password: '', role: 'user' }); setAdminModalOpen(true); }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {adminModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{adminEditingUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
              <button onClick={() => setAdminModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (adminEditingUser) {
                  const payload: any = { name: adminForm.name, lastname: adminForm.lastname, email: adminForm.email, role: adminForm.role };
                  if (adminForm.password) payload.password = adminForm.password;
                  const res = await api(`/users/${adminForm.cedula}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) {
                    await res.json().catch(()=>null);
                    setUsers(prev => prev.map(u => (String(u.cedula) === String(adminForm.cedula)) ? { ...u, name: `${adminForm.name} ${adminForm.lastname}`, email: adminForm.email, role: adminForm.role } : u));
                  }
                } else {
                  const payload = { name: adminForm.name, lastname: adminForm.lastname, cedula: adminForm.cedula, email: adminForm.email, password: adminForm.password, role: adminForm.role };
                  const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (res.ok) {
                    const newUser: User = {
                      id: Number(adminForm.cedula) || Math.floor(Math.random()*100000),
                      cedula: adminForm.cedula,
                      name: `${adminForm.name} ${adminForm.lastname}`,
                      email: adminForm.email,
                      role: adminForm.role,
                      verified: adminForm.role !== 'user',
                      status: 'Activo',
                      joinDate: new Date().toLocaleDateString('es-ES'),
                      reportsCount: 0,
                      lastActivity: 'ahora'
                    };
                    setUsers(prev => [newUser, ...prev]);
                  }
                }
                setAdminModalOpen(false);
                setAdminEditingUser(null);
                setAdminForm({ cedula: '', name: '', lastname: '', email: '', password: '', role: 'user' });
              }}
            >
              {!adminEditingUser && (
                <input value={adminForm.cedula} onChange={e=>setAdminForm({ ...adminForm, cedula: e.target.value })} placeholder="Cédula" className="w-full border rounded-lg px-3 py-2" required />
              )}
              {adminEditingUser && (
                <input value={adminForm.cedula} readOnly placeholder="Cédula" className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
              )}
              <input value={adminForm.name} onChange={e=>setAdminForm({ ...adminForm, name: e.target.value })} placeholder="Nombre" className="w-full border rounded-lg px-3 py-2" required />
              <input value={adminForm.lastname} onChange={e=>setAdminForm({ ...adminForm, lastname: e.target.value })} placeholder="Apellido" className="w-full border rounded-lg px-3 py-2" required />
              <input value={adminForm.email} onChange={e=>setAdminForm({ ...adminForm, email: e.target.value })} type="email" placeholder="Email" className="w-full border rounded-lg px-3 py-2" required />
              <input value={adminForm.password} onChange={e=>setAdminForm({ ...adminForm, password: e.target.value })} type="password" placeholder={adminEditingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'} className="w-full border rounded-lg px-3 py-2" {...(adminEditingUser ? {} : { required: true })} />
              <select value={adminForm.role} onChange={e=>setAdminForm({ ...adminForm, role: e.target.value as User['role'] })} className="w-full border rounded-lg px-3 py-2">
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="security">Seguridad</option>
                <option value="news">Noticias</option>
                <option value="reports">Reportes</option>
                <option value="buses">Buses</option>
                <option value="community">Comunidad</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setAdminModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{adminEditingUser ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cédula</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rol</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Verificado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.cedula || u.id}>
                  <td className="px-3 py-3 text-xs text-gray-900">{u.cedula || u.id}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{u.name}</td>
                  <td className="px-3 py-3 text-xs text-gray-900 hidden sm:table-cell">{u.email}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-50">{u.role}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900">
                    {u.verified ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-green-100 text-green-700 border-green-200">Sí</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-yellow-100 text-yellow-700 border-yellow-200">No</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const [firstName, ...rest] = (u.name || '').split(' ');
                          setAdminEditingUser(u);
                          setAdminForm({ cedula: String(u.cedula || ''), name: firstName || '', lastname: rest.join(' '), email: u.email, password: '', role: u.role });
                          setAdminModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 hover:bg-green-50 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.cedula || String(u.id))}
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

  // (Removed old administrators view)

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
                    const res = await api(`/events/${editingItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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

  const renderCommunity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Comunidad (Foro)</h2>
            <p className="text-gray-600">Modera publicaciones y comentarios de la comunidad</p>
          </div>
          <button onClick={() => { setEditingCommunityPost(null); setCommunityForm({ content: '', photo_link: '' }); setCommunityModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nueva Publicación</span>
          </button>
        </div>
      </div>

      {communityModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{editingCommunityPost ? 'Editar Publicación' : 'Crear Publicación'}</h3>
              <button onClick={() => setCommunityModalOpen(false)} className="text-gray-500">×</button>
            </div>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              if (editingCommunityPost) {
                const res = await api(`/forum/${editingCommunityPost._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: communityForm.content, photo_link: communityForm.photo_link }) });
                if (res.ok) {
                  const updated = await res.json();
                  setCommunityPosts(prev => prev.map(p => (p._id === updated._id) ? updated : p));
                }
              } else {
                let photoUrl: string | undefined = communityForm.photo_link || undefined;
                // If photo_link looks like a data URL, try uploading
                if (photoUrl && photoUrl.startsWith('data:')) photoUrl = undefined;
                const payload = { content: communityForm.content, photo_link: photoUrl, date: new Date().toISOString(), author: user?.cedula || 'admin' } as any;
                const res = await api('/forum', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const created = await res.json();
                  setCommunityPosts(prev => [created, ...prev]);
                }
              }
              setCommunityModalOpen(false);
              setEditingCommunityPost(null);
              setCommunityForm({ content: '', photo_link: '' });
            }}>
              <textarea value={communityForm.content} onChange={e=>setCommunityForm({ ...communityForm, content: e.target.value })} placeholder="Contenido de la publicación" className="w-full border rounded-lg px-3 py-2" rows={4} required />
              <input value={communityForm.photo_link} onChange={e=>setCommunityForm({ ...communityForm, photo_link: e.target.value })} placeholder="Enlace de imagen (opcional)" className="w-full border rounded-lg px-3 py-2" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setCommunityModalOpen(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white">{editingCommunityPost ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y">
          {communityLoading && <div className="p-6 text-center text-sm text-gray-500">Cargando…</div>}
          {!communityLoading && communityPosts.map((p:any) => (
            <div key={p._id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="pr-4">
                  <div className="text-sm text-gray-700 mb-1">{new Date(p.date).toLocaleString('es-ES')}</div>
                  <div className="font-semibold text-gray-900 mb-1">{p.authorName || (typeof p.author === 'string' && p.author.includes(' ') ? p.author : 'Usuario')}</div>
                  {p.status && (
                    <span className={`inline-block mb-2 px-2 py-0.5 rounded-full text-xs border ${p.status==='pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : p.status==='approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {p.status==='pending' ? 'Pendiente' : p.status==='approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {p.ai_flagged && (
                      <span title={p.ai_summary || 'Marcado por IA'} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">IA: Riesgo</span>
                    )}
                    {p.ai_mismatch && (
                      <span title="Texto e imagen no coinciden" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">IA: No coincide</span>
                    )}
                    {p.ai_summary && !p.ai_flagged && !p.ai_mismatch && (
                      <span title={p.ai_summary} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">IA: Ok</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{p.content}</div>
                  {p.photo_link && (
                    /\/file\/d\//.test(p.photo_link) && /\/preview(\?|$)/.test(p.photo_link) ? (
                      <div className="mt-2">
                        <iframe
                          src={p.photo_link}
                          className="w-full rounded-lg border"
                          style={{ height: 200, border: 'none' }}
                          allow="autoplay; encrypted-media"
                          loading="lazy"
                          title="Vista previa"
                        />
                      </div>
                    ) : (
                      <img src={p.photo_link} alt="foto" className="mt-2 max-h-48 rounded-lg border" />
                    )
                  )}
                </div>
                <div className="flex gap-1 items-center">
                  {p.status === 'pending' && (
                    <>
                      <button onClick={async()=>{ try { await api(`/forum/${p._id}/approve`, { method: 'POST' }); } finally { refreshCommunity(); } }} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Aprobar</button>
                      <button onClick={async()=>{ try { await api(`/forum/${p._id}/reject`, { method: 'POST' }); } finally { refreshCommunity(); } }} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Rechazar</button>
                    </>
                  )}
                  <button onClick={() => { setEditingCommunityPost(p); setCommunityForm({ content: p.content || '', photo_link: p.photo_link || '' }); setCommunityModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                  <button onClick={async () => { try { await api(`/forum/${p._id}`, { method: 'DELETE' }); } finally { refreshCommunity(); } }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-3 border-t pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Comentarios</div>
                <div className="space-y-2">
                  {(communityComments[p._id] || []).map((c:any) => (
                    <div key={c._id} className="text-xs text-gray-700 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{c.authorName || (typeof c.author === 'string' && c.author.includes(' ') ? c.author : 'Usuario')}</div>
                        <div>{c.content}</div>
                        <div className="text-[10px] text-gray-500">{new Date(c.date).toLocaleString('es-ES')}</div>
                      </div>
                      <button onClick={async () => { const res = await api(`/forum/comments/${c._id}`, { method: 'DELETE' }); if (res.ok) setCommunityComments(prev => ({ ...prev, [p._id]: (prev[p._id]||[]).filter(x => x._id !== c._id) })); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <form className="mt-2 flex gap-2" onSubmit={async (e) => {
                  e.preventDefault();
                  const content = commentDrafts[p._id] || '';
                  if (!content.trim()) return;
                  const res = await api(`/forum/${p._id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, author: user?.cedula || 'admin' }) });
                  if (res.ok) {
                    const created = await res.json();
                    setCommunityComments(prev => ({ ...prev, [p._id]: [ ...(prev[p._id]||[]), created ] }));
                    setCommentDrafts(prev => ({ ...prev, [p._id]: '' }));
                  }
                }}>
                  <input value={commentDrafts[p._id] || ''} onChange={e=>setCommentDrafts(prev => ({ ...prev, [p._id]: e.target.value }))} className="flex-1 border rounded-lg px-3 py-2 text-xs" placeholder="Escribe un comentario…" />
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs">Comentar</button>
                </form>
              </div>
            </div>
          ))}
          {!communityLoading && communityPosts.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">No hay publicaciones aún.</div>
          )}
        </div>
      </div>
    </div>
  );

  // Initial data loads from backend
  useEffect(() => {
    const token = localStorage.getItem('authToken') || '';
    
    // Users
    fetch('/api/users', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const mapped: User[] = rows.map((u:any) => ({
            id: Number(u.cedula) || Math.floor(Math.random()*100000),
            cedula: String(u.cedula || ''),
            name: `${u.name} ${u.lastname}`,
            email: u.email,
            role: (u.role || 'user'),
            verified: !!u.verified,
            status: 'Activo',
            joinDate: new Date(u.created_at || Date.now()).toLocaleDateString('es-ES'),
            reportsCount: 0,
            lastActivity: 'hace poco'
          }));
          setUsers(mapped);
        }
      }).catch(()=>{});

    // Events
    fetch('/api/events', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
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
    api('/reports')
      .then(r => r.json())
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        const mapped: Report[] = list.map((r:any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          type: r.type || 'General',
          location: r.location || 'N/A',
          status: (r.status === 'pending' ? 'Pendiente' : r.status) as Report['status'],
          date: new Date(r.date).toLocaleDateString('es-ES'),
          user: r.author || 'Usuario',
          priority: 'Media',
          photoLink: r.photo_link || undefined,
          image: (() => {
            const raw = r.photo_link as string | undefined;
            if (!raw) return undefined;
            try {
              const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
              let id = m?.[1];
              if (!id) { try { const u = new URL(raw); id = u.searchParams.get('id') || undefined; } catch {} }
              if (id) return `https://drive.google.com/thumbnail?id=${id}`;
            } catch {}
            return raw;
          })(),
        }));
        setReports(mapped);
      }).catch(()=>{ setReports([]); });
    api('/news')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => { if (Array.isArray(rows)) setNewsItems(rows); })
      .catch(()=>{});

    // Complaints
    fetch('/api/complaints', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => {
        if (Array.isArray(rows)) setComplaints(rows);
      }).catch(()=>{});

    // Hotspots + load comments per hotspot for admin view
    fetch('/api/security/hotspots', { 
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
      .then(r => r.ok ? r.json() : [])
      .then(async (rows:any[]) => {
        if (Array.isArray(rows)) {
          setHotspots(rows);
          const entries: Record<string, any[]> = {};
          for (const h of rows) {
            const id = (h._id || h.id);
            try {
              const cr = await api(`/security/hotspots/${id}/comments`);
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
  fetch('/api/dangerous-areas', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } })
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => { if (Array.isArray(rows)) setDangerous(rows); })
      .catch(()=>{});

    // Security News
  fetch('/api/security-news', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } })
      .then(r => r.ok ? r.json() : [])
      .then((rows:any[]) => { if (Array.isArray(rows)) setSecurityNews(rows); })
      .catch(()=>{});

    // Comunidad (admin only pre-load)
    if ((user?.role || 'user') === 'admin' || (user?.role || 'user') === 'community') {
      setCommunityLoading(true);
  fetch('/api/forum', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } })
        .then(r => r.ok ? r.json() : [])
        .then(async (rows:any[]) => {
          const toEmbeddable = (url?: string) => {
            if (!url) return undefined;
            try {
              const raw = String(url);
              const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
              let id = m?.[1];
              if (!id) { try { const u = new URL(raw); id = u.searchParams.get('id') || undefined; } catch {} }
              if (id) return `https://drive.google.com/file/d/${id}/preview`;
              return raw;
            } catch { return url; }
          };
          const posts = (Array.isArray(rows) ? rows : []).map(p => ({ ...p, photo_link: toEmbeddable(p.photo_link) }));
          setCommunityPosts(posts);
          const all: Record<string, any[]> = {};
          for (const p of posts) {
            try {
              const cr = await api(`/forum/${p._id || p.id}/comments`);
              if (cr.ok) all[p._id || p.id] = await cr.json();
            } catch {}
          }
          setCommunityComments(all);
        })
        .catch(()=>{})
        .finally(() => setCommunityLoading(false));
    }
  }, []);

  // Load buses when switching to Buses tab
  useEffect(() => {
    const shouldLoad = (activeTab === 'buses') && (role === 'admin' || role === 'buses');
    if (!shouldLoad) return;
    (async () => {
      try {
        const r = await api('/buses');
        if (r.ok) setAdminBuses(await r.json());
      } catch {}
    })();
  }, [activeTab, role]);

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
                const res = await api(`/news/${editingNews.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
                <button onClick={async () => { const res = await api(`/news/${n.id}`, { method: 'DELETE' }); if (res.ok) setNewsItems(prev => prev.filter(x => x.id !== n.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
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

  const renderBuses = () => {
    const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyDluFc7caulw2jHJKsPM_mGnLa8oLuFgio';
    const filtered = busesFilter==='Todos' ? adminBuses : adminBuses.filter((b:any) => (b.status||'')===busesFilter);
    const points = filtered
      .filter((b:any) => typeof b.lat === 'number' && typeof b.lng === 'number')
      .map((b:any, i:number) => ({ id: b._id || i, title: b.busNumber ? `Bus ${b.busNumber}` : 'Bus', lat: b.lat, lng: b.lng }));
    const selected = (() => {
      const f = adminBuses.find((b:any) => (b._id || b.id) === busCenterId);
      return f && typeof f.lat === 'number' && typeof f.lng === 'number' ? { lat: f.lat, lng: f.lng } : undefined;
    })();
    const refresh = async () => {
      setBusesLoading(true);
      try {
        const r = await api('/buses');
        const rows = r.ok ? await r.json() : [];
        setAdminBuses(Array.isArray(rows) ? rows : []);
      } finally {
        setBusesLoading(false);
      }
    };
    const approve = async (id: string) => {
      try {
        await api(`/buses/${id}/approve`, { method: 'POST' });
      } catch (e) {
        console.error('Error approving:', e);
      } finally {
        refresh();
      }
    };
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sistema de Buses</h2>
              <p className="text-gray-600 text-sm">Monitoreo en vivo y aprobación de conductores</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={busesFilter} onChange={e=>setBusesFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option>Todos</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <button onClick={refresh} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> {busesLoading ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </div>
          <div className="mt-2">
            <HotspotsMap
              apiKey={GOOGLE_MAPS_KEY}
              points={points}
              selected={selected}
              height={360}
              showAutocomplete={false}
              markerIcon={"/bus-marker.svg"}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Buses registrados</h3>
            <span className="text-sm text-gray-600">{filtered.length} buses</span>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && <div className="text-sm text-gray-600">No hay registros.</div>}
            {filtered.map((b:any) => (
              <div key={b._id || b.id} className="p-4 border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg"><Bus className="h-5 w-5 text-blue-600"/></div>
                  <div>
                    <div className="font-semibold text-gray-900">{b.routeStart || 'Inicio'} → {b.routeEnd || 'Destino'}</div>
                    <div className="text-xs text-gray-600">
                      Bus {b.busNumber || 's/n'} • Placa {b.busId || 'N/D'} • 
                      Estado: <span className={`ml-1 font-medium ${b.status === 'pending' ? 'text-yellow-600' : b.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                        {b.status === 'pending' ? '⏳ Pendiente' : b.status === 'approved' ? '✓ Aprobado' : '✗ Rechazado'}
                      </span>
                      {b.isActive && <span className="ml-1 text-green-600">• 🟢 En servicio</span>}
                      • Tarifa ₡<input defaultValue={String(b.fee ?? '')} onBlur={async (e)=>{ const v=Number(e.currentTarget.value)||0; const u = await api(`/buses/${b._id || b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fee: v })}); if (u.ok){ const nb = await u.json(); setAdminBuses(prev=>prev.map(x=>(x._id||x.id)===(b._id||b.id)? nb : x)); } }} className="w-20 border rounded px-1 py-0.5 text-xs" />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Conductor: {b.driverCedula || 'N/D'}</div>
                    {b.driverLicense && <div className="text-xs text-gray-600">Licencia: {b.driverLicense}</div>}
                    {(typeof b.lat === 'number' && typeof b.lng === 'number') && (
                      <div className="text-[11px] text-gray-500">Última ubicación: {b.lat.toFixed(5)}, {b.lng.toFixed(5)} {b.lastLocationUpdate && `(${new Date(b.lastLocationUpdate).toLocaleTimeString('es-CR')})`}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => approve(b._id || b.id)} className="px-3 py-2 rounded bg-green-600 text-white text-sm flex items-center gap-1"><Check className="h-4 w-4"/>Aprobar</button>
                      <button onClick={async ()=>{ try { await api(`/buses/${b._id || b.id}/reject`, { method: 'POST' }); } catch(e) { console.error(e); } finally { refresh(); } }} className="px-3 py-2 rounded bg-yellow-600 text-white text-sm">Rechazar</button>
                    </>
                  )}
                  {(typeof b.lat === 'number' && typeof b.lng === 'number') && (
                    <button onClick={() => setBusCenterId(b._id || b.id)} className="px-3 py-2 rounded bg-blue-500 text-white text-sm flex items-center gap-1"><Navigation className="h-4 w-4"/>Ubicar</button>
                  )}
                  <button onClick={async ()=>{ try { await api(`/buses/${b._id || b.id}`, { method: 'DELETE' }); } catch(e) { console.error(e); } finally { refresh(); } }} className="px-3 py-2 rounded bg-red-600 text-white text-sm">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
                const res = await api(`/dangerous-areas/${editingDanger.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
          {dangerous.map((d:any, idx:number) => {
            const lvl = String(d.dangerlevel || 'medium').toLowerCase();
            const label = lvl === 'high' ? 'Alto' : lvl === 'medium' ? 'Medio' : 'Bajo';
            const pill = lvl === 'high' ? 'bg-red-100 text-red-700' : lvl === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
            return (
            <div key={d.id ?? idx} className="p-4 flex items-start justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pill}`}>{label}</span>
                  <span className="text-xs text-gray-500">{new Date(d.date).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="font-semibold text-gray-900">{d.title}</div>
                <div className="text-xs text-gray-600">{d.description}</div>
                {d.location && <div className="text-xs text-blue-600">{d.location}</div>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingDanger(d); setDangerForm({ title: d.title || '', description: d.description || '', location: d.location || '', date: (d.date ? new Date(d.date).toISOString().slice(0,10) : ''), dangerlevel: (d.dangerlevel || 'medium') }); setDangerModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={async () => { const res = await api(`/dangerous-areas/${d.id}`, { method: 'DELETE' }); if (res.ok) setDangerous(prev => prev.filter(x => x.id !== d.id)); }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );})}
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
                const res = await api(`/security-news/${editingSecurityNews.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) {
                  const updated = await res.json();
                  setSecurityNews(prev => prev.map(n => n.id === editingSecurityNews.id ? updated : n));
                }
              } else {
                const res = await api(`/security-news`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
                <button onClick={async () => {
                  try {
                    const res = await api(`/security-news/${n.id}`, { method: 'DELETE' });
                    if (res.ok) setSecurityNews(prev => prev.filter(x => x.id !== n.id));
                  } catch (e) {
                    // Optionally show a toast
                  }
                }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
          <button onClick={() => { setEditingComplaint(null); setComplaintForm({ type: '', title: '', description: '', location: '', status: 'Pendiente' }); setComplaintModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
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
                <option value="Pendiente">Pendiente</option>
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
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
                <button onClick={() => { setEditingComplaint(c); setComplaintForm({ type: c.type || '', title: c.title || '', description: c.description || '', location: c.location || '', status: c.status || 'Pendiente' }); setComplaintModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
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
              {activeTab === 'buses' && 'Sistema de Buses'}
              {activeTab === 'community' && 'Comunidad (Foro)'}
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
              {activeTab === 'community' && 'Modera publicaciones y comentarios del foro'}
              {activeTab === 'events' && 'Crea y administra eventos comunitarios'}
              {activeTab === 'buses' && 'Monitorea buses, aprueba conductores y ubica unidades'}
              {activeTab === 'settings' && 'Configuración general del sistema'}
            </p>
          </div>
          
          <div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'reports' && (role==='admin' || role==='reports') && renderReports()}
            {activeTab === 'news' && (role==='admin' || role==='news') && renderNews()}
            {activeTab === 'dangerous' && (role==='admin' || role==='security') && renderDangerous()}
            {activeTab === 'securityNews' && (role==='admin' || role==='security') && renderSecurityNews()}
            {activeTab === 'users' && role==='admin' && renderUsers()}
            {/* administrators tab merged into users */}
            {activeTab === 'community' && (role==='admin' || role==='community') && renderCommunity()}
            {activeTab === 'complaints' && (role==='admin' || role==='security') && renderComplaints()}
            {activeTab === 'hotspots' && (role==='admin' || role==='security') && renderHotspots()}
            {activeTab === 'events' && (role==='admin' || role==='news') && renderEvents()}
            {activeTab === 'buses' && (role==='admin' || role==='buses') && renderBuses()}
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
  <nav className="flex items-center gap-6 w-full sm:max-w-3xl mx-auto justify-start sm:justify-center overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory sm:snap-none">
          {visibleTabs.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center p-2 transition-all duration-300 transform snap-center ${
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