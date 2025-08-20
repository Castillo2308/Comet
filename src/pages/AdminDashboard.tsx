import React, { useState } from 'react';
import { Users, FileText, AlertTriangle, Bus, Calendar, MessageSquare, BarChart3, Settings, Trash2, Edit, Eye, Plus, Search, Filter, Download, Upload, RefreshCw, TrendingUp, Activity, Bell, CheckCircle, XCircle, Clock, MapPin, X, Save, UserPlus, CalendarPlus, FileTextIcon } from 'lucide-react';
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
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  status: 'Programado' | 'En Curso' | 'Finalizado' | 'Cancelado';
  category: string;
  description: string;
  price: string;
  organizer: string;
}

interface Announcement {
  id: number;
  title: string;
  description: string;
  type: 'Servicios' | 'Transporte' | 'Eventos' | 'Seguridad';
  priority: 'high' | 'medium' | 'low';
  date: string;
  status: 'Activo' | 'Inactivo';
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
    time: '09:00 AM',
    location: 'Centro Comunal',
    attendees: 45,
    maxAttendees: 100,
    status: 'Programado',
    category: 'Comercio',
    description: 'Feria mensual de emprendedores locales',
    price: 'Gratis',
    organizer: 'Municipalidad'
  },
  {
    id: 2,
    title: 'Festival Cultural',
    date: '2024-02-25',
    time: '06:00 PM',
    location: 'Parque Central',
    attendees: 120,
    maxAttendees: 200,
    status: 'Programado',
    category: 'Cultural',
    description: 'Celebración de la cultura local',
    price: 'Gratis',
    organizer: 'Casa de la Cultura'
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Corte de agua programado',
    description: 'El próximo martes 20 de febrero habrá corte de agua de 8:00 AM a 4:00 PM',
    type: 'Servicios',
    priority: 'high',
    date: '2024-02-15',
    status: 'Activo'
  },
  {
    id: 2,
    title: 'Nueva ruta de autobús',
    description: 'Se inaugura la nueva ruta 405 que conectará el centro con la zona industrial',
    type: 'Transporte',
    priority: 'medium',
    date: '2024-02-14',
    status: 'Activo'
  }
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'user' | 'event' | 'announcement'>('user');

  const adminNavItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'users', icon: Users, label: 'Usuarios' },
    { id: 'events', icon: Calendar, label: 'Eventos' },
    { id: 'announcements', icon: Bell, label: 'Anuncios' }
  ];

  // CRUD Operations
  const handleUpdateReportStatus = (reportId: number, newStatus: Report['status']) => {
    setReports(reports.map(report =>
      report.id === reportId ? { ...report, status: newStatus } : report
    ));
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      setReports(reports.filter(report => report.id !== reportId));
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingItem({ ...report, type: 'report' });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingItem({ ...user, type: 'user' });
  };

  const handleToggleUserStatus = (userId: number) => {
    setUsers(users.map(user =>
      user.id === userId 
        ? { ...user, status: user.status === 'Activo' ? 'Inactivo' : 'Activo' }
        : user
    ));
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      setEvents(events.filter(event => event.id !== eventId));
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingItem({ ...event, type: 'event' });
  };

  const handleDeleteAnnouncement = (announcementId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
      setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingItem({ ...announcement, type: 'announcement' });
  };

  const handleBulkAction = (action: string) => {
    if (action === 'delete' && confirm(`¿Estás seguro de que quieres eliminar ${selectedItems.length} elementos?`)) {
      if (activeTab === 'reports') {
        setReports(reports.filter(report => !selectedItems.includes(report.id)));
      } else if (activeTab === 'users') {
        setUsers(users.filter(user => !selectedItems.includes(user.id)));
      } else if (activeTab === 'events') {
        setEvents(events.filter(event => !selectedItems.includes(event.id)));
      } else if (activeTab === 'announcements') {
        setAnnouncements(announcements.filter(announcement => !selectedItems.includes(announcement.id)));
      }
      setSelectedItems([]);
    }
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    if (editingItem.type === 'report') {
      setReports(reports.map(report =>
        report.id === editingItem.id ? { ...editingItem } : report
      ));
    } else if (editingItem.type === 'user') {
      setUsers(users.map(user =>
        user.id === editingItem.id ? { ...editingItem } : user
      ));
    } else if (editingItem.type === 'event') {
      setEvents(events.map(event =>
        event.id === editingItem.id ? { ...editingItem } : event
      ));
    } else if (editingItem.type === 'announcement') {
      setAnnouncements(announcements.map(announcement =>
        announcement.id === editingItem.id ? { ...editingItem } : announcement
      ));
    }
    setEditingItem(null);
  };

  const handleCreateNew = () => {
    const newItem = {
      id: Date.now(),
      title: 'Nuevo elemento',
      description: 'Descripción del nuevo elemento',
      date: new Date().toISOString().split('T')[0],
      status: 'Activo'
    };

    if (createType === 'user') {
      const newUser: User = {
        ...newItem,
        name: 'Nuevo Usuario',
        email: 'nuevo@email.com',
        role: 'user',
        status: 'Activo',
        joinDate: newItem.date,
        reportsCount: 0,
        lastActivity: 'nunca'
      };
      setUsers([newUser, ...users]);
    } else if (createType === 'event') {
      const newEvent: Event = {
        ...newItem,
        time: '10:00 AM',
        location: 'Por definir',
        attendees: 0,
        maxAttendees: 100,
        status: 'Programado',
        category: 'General',
        price: 'Gratis',
        organizer: 'Municipalidad'
      };
      setEvents([newEvent, ...events]);
    } else if (createType === 'announcement') {
      const newAnnouncement: Announcement = {
        ...newItem,
        type: 'Servicios',
        priority: 'medium'
      };
      setAnnouncements([newAnnouncement, ...announcements]);
    }
    setShowCreateModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700';
      case 'En Proceso': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700';
      case 'Resuelto': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      case 'Rechazado': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
      case 'Activo': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      case 'Inactivo': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
      case 'Programado': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700';
      case 'En Curso': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700';
      case 'Finalizado': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      case 'Cancelado': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
      case 'Media': case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700';
      case 'Baja': case 'low': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'Todos' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredEvents = events.filter(event => {
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredAnnouncements = announcements.filter(announcement => {
    return announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  const renderEditModal = () => {
    if (!editingItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar {editingItem.type === 'report' ? 'Reporte' : 
                       editingItem.type === 'user' ? 'Usuario' : 
                       editingItem.type === 'event' ? 'Evento' : 'Anuncio'}
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {editingItem.type === 'report' && (
                <>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Título del reporte"
                  />
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Descripción"
                  />
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ubicación"
                  />
                  <select
                    value={editingItem.priority}
                    onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Baja">Prioridad Baja</option>
                    <option value="Media">Prioridad Media</option>
                    <option value="Alta">Prioridad Alta</option>
                  </select>
                </>
              )}

              {editingItem.type === 'user' && (
                <>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nombre completo"
                  />
                  <input
                    type="email"
                    value={editingItem.email}
                    onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Email"
                  />
                  <select
                    value={editingItem.role}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </>
              )}

              {editingItem.type === 'event' && (
                <>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Título del evento"
                  />
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Descripción"
                  />
                  <input
                    type="date"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="time"
                    value={editingItem.time}
                    onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ubicación"
                  />
                  <input
                    type="number"
                    value={editingItem.maxAttendees}
                    onChange={(e) => setEditingItem({ ...editingItem, maxAttendees: parseInt(e.target.value) })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Máximo de asistentes"
                  />
                </>
              )}

              {editingItem.type === 'announcement' && (
                <>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Título del anuncio"
                  />
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Descripción"
                  />
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Servicios">Servicios</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Seguridad">Seguridad</option>
                  </select>
                  <select
                    value={editingItem.priority}
                    onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value })}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Prioridad Baja</option>
                    <option value="medium">Prioridad Media</option>
                    <option value="high">Prioridad Alta</option>
                  </select>
                </>
              )}
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md transform transition-all duration-300 animate-scaleIn">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Crear {createType === 'user' ? 'Usuario' : createType === 'event' ? 'Evento' : 'Anuncio'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setCreateType('user')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  createType === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Usuario
              </button>
              <button
                onClick={() => setCreateType('event')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  createType === 'event' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Evento
              </button>
              <button
                onClick={() => setCreateType('announcement')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  createType === 'announcement' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Anuncio
              </button>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Crear</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-r ${
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'from-green-500 to-green-600' :
                  stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-red-500 to-red-600'
                } p-2 rounded-lg shadow-lg`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' : 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{stat.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
            Actividad del Sistema
          </h3>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200">
              7 días
            </button>
            <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              30 días
            </button>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-600 dark:text-blue-300 font-medium">Gráfico de actividad</p>
            <p className="text-blue-500 dark:text-blue-400 text-sm">Datos en tiempo real</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Actividad Reciente
          </h3>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Ver todo</button>
        </div>
        <div className="space-y-4">
          {reports.slice(0, 5).map((report, index) => (
            <div 
              key={report.id} 
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{report.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Por {report.user} • {report.location}</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Gestión de Reportes</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Administra todos los reportes ciudadanos</p>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="Todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Rechazado">Rechazado</option>
            </select>
            {selectedItems.length > 0 && (
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-1 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span>({selectedItems.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
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
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Reporte</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden sm:table-cell">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden md:table-cell">Prioridad</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.map((report, index) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-fadeInUp"
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {report.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {report.user.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{report.user}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={report.status}
                      onChange={(e) => handleUpdateReportStatus(report.id, e.target.value as Report['status'])}
                      className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(report.status)}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditReport(report)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 p-1 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                        title="Editar reporte"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                        title="Eliminar reporte"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Gestión de Usuarios</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Administra usuarios registrados</p>
          </div>
          <button 
            onClick={() => {
              setCreateType('user');
              setShowCreateModal(true);
            }}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            title="Crear usuario"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase hidden md:table-cell">Reportes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 animate-fadeInUp"
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Desde {user.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white hidden sm:table-cell">{user.email}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleToggleUserStatus(user.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${getStatusColor(user.status)}`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.reportsCount}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">reportes</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200 p-1 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Gestión de Eventos</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Crea y administra eventos comunitarios</p>
          </div>
          <button 
            onClick={() => {
              setCreateType('event');
              setShowCreateModal(true);
            }}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            title="Crear evento"
          >
            <CalendarPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((event, index) => (
          <div 
            key={event.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEditEvent(event)}
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200 p-1 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                  title="Editar evento"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  title="Eliminar evento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{event.description}</p>
            
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-2" />
                {event.date} • {event.time}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-2" />
                {event.location}
              </div>
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-2" />
                {event.attendees}/{event.maxAttendees} asistentes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Gestión de Anuncios</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Administra anuncios importantes</p>
          </div>
          <button 
            onClick={() => {
              setCreateType('announcement');
              setShowCreateModal(true);
            }}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            title="Crear anuncio"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar anuncios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredAnnouncements.map((announcement, index) => (
          <div 
            key={announcement.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority === 'high' ? 'Alta' : announcement.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{announcement.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                    {announcement.type}
                  </span>
                  <span>{announcement.date}</span>
                </div>
              </div>
              <div className="flex space-x-1 ml-4">
                <button 
                  onClick={() => handleEditAnnouncement(announcement)}
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200 p-1 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                  title="Editar anuncio"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  title="Eliminar anuncio"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <Settings className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Configuración del Sistema</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Ajustes generales y configuración de la plataforma.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Configuración General</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Ajustes básicos del sistema</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Seguridad</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Configuración de seguridad</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notificaciones</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Gestión de notificaciones</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Respaldos</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Backup y restauración</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-xl backdrop-blur-sm">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
                <p className="text-blue-100 text-sm">Bienvenido, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg text-sm self-start sm:self-auto"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'dashboard' && 'Dashboard Principal'}
              {activeTab === 'reports' && 'Gestión de Reportes'}
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'events' && 'Gestión de Eventos'}
              {activeTab === 'announcements' && 'Gestión de Anuncios'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {activeTab === 'dashboard' && 'Vista general del sistema y estadísticas'}
              {activeTab === 'reports' && 'Administra todos los reportes ciudadanos'}
              {activeTab === 'users' && 'Gestiona usuarios registrados'}
              {activeTab === 'events' && 'Crea y administra eventos comunitarios'}
              {activeTab === 'announcements' && 'Gestiona anuncios importantes'}
            </p>
          </div>
          
          <div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'announcements' && renderAnnouncements()}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-30 shadow-2xl">
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
                    ? 'text-blue-500 dark:text-blue-400 scale-110 bg-blue-50 dark:bg-blue-900 rounded-xl px-3 py-2'
                    : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:scale-105 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl px-3 py-2'
                }`}
              >
                <IconComponent className="h-5 w-5 mb-1 transition-transform duration-200" />
                <span className="text-xs font-medium transition-all duration-200">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modals */}
      {renderEditModal()}
      {renderCreateModal()}
    </div>
  );
}