import { useEffect, useState } from 'react';
import { Users, FileText, AlertTriangle, Calendar, BarChart3, Settings, Trash2, Edit, Plus, Search, Download, RefreshCw, Activity, Clock, MapPin, Megaphone, Shield, MessageSquare, Bus, Check, Image as ImageIcon, Bell } from 'lucide-react';
import HotspotsMap, { HotspotPoint } from '../components/HotspotsMap';
import BusesMap from '../components/BusesMap';
import { GoogleMapsProvider } from '../components/GoogleMapsProvider';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  // Admin hotspots map selection state
  const [selectedHotspotCenter, setSelectedHotspotCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | number | undefined>(undefined);
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
  const [communityForm, setCommunityForm] = useState<{ content: string; photo_link?: string; status?: 'pending' | 'approved' | 'rejected' } >({ content: '', photo_link: '', status: 'pending' });
  const [communityComments, setCommunityComments] = useState<Record<string, any[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
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

  // Función para exportar reportes a Excel
  const exportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = filteredReports.map(report => ({
      'ID': report.id,
      'Título': report.title,
      'Descripción': report.description,
      'Tipo': report.type,
      'Ubicación': report.location,
      'Estado': report.status,
      'Fecha': report.date,
      'Usuario': report.user,
      'Prioridad': report.priority
    }));

    // Crear un libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');

    // Generar el archivo y descargarlo
    const fileName = `Reportes_COMET_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Función para exportar reportes a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text('Sistema COMET - Reportes Ciudadanos', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    doc.text(`Total de reportes: ${filteredReports.length}`, 14, 36);

    // Preparar datos para la tabla
    const tableData = filteredReports.map(report => [
      report.id,
      report.title,
      report.location,
      report.status,
      report.date,
      report.user
    ]);

    // Agregar tabla
    autoTable(doc, {
      head: [['ID', 'Título', 'Ubicación', 'Estado', 'Fecha', 'Usuario']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { top: 42 }
    });

    // Guardar el PDF
    const fileName = `Reportes_COMET_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Función que muestra un menú para elegir el formato de exportación
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Funciones para backup completo del sistema
  const backupToExcel = async () => {
    try {
      // Mostrar mensaje de carga
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center';
      loadingMsg.innerHTML = '<div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl"><div class="flex items-center space-x-3"><svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-lg font-semibold text-gray-900 dark:text-white">Obteniendo datos de la base de datos...</span></div></div>';
      document.body.appendChild(loadingMsg);

      // Esperar un poco para que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener todos los datos frescos de la base de datos con reintentos
      const fetchWithRetry = async (url: string, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
            });
            if (response.ok) return response;
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        throw new Error('Max retries reached');
      };

      const [reportsRes, usersRes, eventsRes, complaintsRes, newsRes, dangerousRes, securityNewsRes, hotspotsRes, communityRes, busesRes] = await Promise.all([
        fetchWithRetry('/api/reports').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/users').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/events').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/complaints').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/news').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/dangerous-areas').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/security-news').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/security/hotspots').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/forum').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/buses').catch(() => ({ ok: false } as Response))
      ]);

      const reportsData = reportsRes.ok && 'json' in reportsRes ? await reportsRes.json() : [];
      const usersData = usersRes.ok && 'json' in usersRes ? await usersRes.json() : [];
      const eventsData = eventsRes.ok && 'json' in eventsRes ? await eventsRes.json() : [];
      const complaintsData = complaintsRes.ok && 'json' in complaintsRes ? await complaintsRes.json() : [];
      const newsData = newsRes.ok && 'json' in newsRes ? await newsRes.json() : [];
      const dangerousData = dangerousRes.ok && 'json' in dangerousRes ? await dangerousRes.json() : [];
      const securityNewsData = securityNewsRes.ok && 'json' in securityNewsRes ? await securityNewsRes.json() : [];
      const hotspotsData = hotspotsRes.ok && 'json' in hotspotsRes ? await hotspotsRes.json() : [];
      const communityData = communityRes.ok && 'json' in communityRes ? await communityRes.json() : [];
      const busesData = busesRes.ok && 'json' in busesRes ? await busesRes.json() : [];

      // Remover mensaje de carga
      document.body.removeChild(loadingMsg);

      // Crear un libro de trabajo con múltiples hojas
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Reportes (siempre crear)
      const reportsSheet = (Array.isArray(reportsData) && reportsData.length > 0) 
        ? reportsData.map((r: any) => ({
            'ID': r.id || '',
            'Título': r.title || '',
            'Descripción': r.description || '',
            'Tipo': r.type || '',
            'Ubicación': r.location || '',
            'Estado': r.status || '',
            'Fecha': r.date ? new Date(r.date).toLocaleDateString('es-ES') : '',
            'Usuario': r.user || r.author || '',
            'Prioridad': r.priority || ''
          }))
        : [{ 'ID': '', 'Título': '', 'Descripción': '', 'Tipo': '', 'Ubicación': '', 'Estado': '', 'Fecha': '', 'Usuario': '', 'Prioridad': '' }];
      const wsReports = XLSX.utils.json_to_sheet(reportsSheet);
      XLSX.utils.book_append_sheet(workbook, wsReports, 'Reportes');

      // Hoja 2: Usuarios (siempre crear, SIN CONTRASEÑA)
      const usersSheet = (Array.isArray(usersData) && usersData.length > 0)
        ? usersData.map((u: any) => ({
            'ID': u.id || '',
            'Cédula': u.cedula || '',
            'Nombre': u.name || '',
            'Apellido': u.lastname || '',
            'Email': u.email || '',
            'Rol': u.role || '',
            'Verificado': u.verified ? 'Sí' : 'No',
            'Fecha Creación': u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : ''
          }))
        : [{ 'ID': '', 'Cédula': '', 'Nombre': '', 'Apellido': '', 'Email': '', 'Rol': '', 'Verificado': '', 'Fecha Creación': '' }];
      const wsUsers = XLSX.utils.json_to_sheet(usersSheet);
      XLSX.utils.book_append_sheet(workbook, wsUsers, 'Usuarios');

      // Hoja 3: Eventos (siempre crear)
      const eventsSheet = (Array.isArray(eventsData) && eventsData.length > 0)
        ? eventsData.map((e: any) => ({
            'ID': e.id || '',
            'Título': e.title || '',
            'Descripción': e.description || '',
            'Tipo': e.type || '',
            'Fecha': e.date ? new Date(e.date).toLocaleDateString('es-ES') : '',
            'Ubicación': e.location || '',
            'Asistentes': e.attendants || 0,
            'Anfitrión': e.host || '',
            'Precio': e.price || 'Gratis'
          }))
        : [{ 'ID': '', 'Título': '', 'Descripción': '', 'Tipo': '', 'Fecha': '', 'Ubicación': '', 'Asistentes': '', 'Anfitrión': '', 'Precio': '' }];
      const wsEvents = XLSX.utils.json_to_sheet(eventsSheet);
      XLSX.utils.book_append_sheet(workbook, wsEvents, 'Eventos');

      // Hoja 4: Quejas (siempre crear)
      const complaintsSheet = (Array.isArray(complaintsData) && complaintsData.length > 0)
        ? complaintsData.map((c: any) => ({
            'ID': c.id || '',
            'Título': c.title || '',
            'Descripción': c.description || '',
            'Tipo': c.type || '',
            'Ubicación': c.location || '',
            'Estado': c.status || '',
            'Fecha': c.date ? new Date(c.date).toLocaleDateString('es-ES') : '',
            'Autor': c.author || ''
          }))
        : [{ 'ID': '', 'Título': '', 'Descripción': '', 'Tipo': '', 'Ubicación': '', 'Estado': '', 'Fecha': '', 'Autor': '' }];
      const wsComplaints = XLSX.utils.json_to_sheet(complaintsSheet);
      XLSX.utils.book_append_sheet(workbook, wsComplaints, 'Quejas');

      // Hoja 5: Noticias (siempre crear)
      const newsSheet = (Array.isArray(newsData) && newsData.length > 0)
        ? newsData.map((n: any) => ({
            'ID': n.id || '',
            'Tipo': n.type || '',
            'Título': n.title || '',
            'Descripción': n.description || '',
            'Urgente': n.insurgent ? 'Sí' : 'No',
            'Fecha': n.date ? new Date(n.date).toLocaleDateString('es-ES') : '',
            'Autor': n.author || ''
          }))
        : [{ 'ID': '', 'Tipo': '', 'Título': '', 'Descripción': '', 'Urgente': '', 'Fecha': '', 'Autor': '' }];
      const wsNews = XLSX.utils.json_to_sheet(newsSheet);
      XLSX.utils.book_append_sheet(workbook, wsNews, 'Noticias');

      // Hoja 6: Áreas Peligrosas (siempre crear)
      const dangerousSheet = (Array.isArray(dangerousData) && dangerousData.length > 0)
        ? dangerousData.map((d: any) => ({
            'ID': d.id || '',
            'Título': d.title || '',
            'Descripción': d.description || '',
            'Ubicación': d.location || '',
            'Nivel de Peligro': d.dangerlevel || '',
            'Fecha': d.date ? new Date(d.date).toLocaleDateString('es-ES') : '',
            'Autor': d.author || ''
          }))
        : [{ 'ID': '', 'Título': '', 'Descripción': '', 'Ubicación': '', 'Nivel de Peligro': '', 'Fecha': '', 'Autor': '' }];
      const wsDangerous = XLSX.utils.json_to_sheet(dangerousSheet);
      XLSX.utils.book_append_sheet(workbook, wsDangerous, 'Áreas Peligrosas');

      // Hoja 7: Noticias de Seguridad (siempre crear)
      const securityNewsSheet = (Array.isArray(securityNewsData) && securityNewsData.length > 0)
        ? securityNewsData.map((s: any) => ({
            'ID': s.id || '',
            'Tipo': s.type || '',
            'Título': s.title || '',
            'Descripción': s.description || '',
            'Urgente': s.insurgent ? 'Sí' : 'No',
            'Fecha': s.date ? new Date(s.date).toLocaleDateString('es-ES') : '',
            'Autor': s.author || ''
          }))
        : [{ 'ID': '', 'Tipo': '', 'Título': '', 'Descripción': '', 'Urgente': '', 'Fecha': '', 'Autor': '' }];
      const wsSecurityNews = XLSX.utils.json_to_sheet(securityNewsSheet);
      XLSX.utils.book_append_sheet(workbook, wsSecurityNews, 'Noticias Seguridad');

      // Hoja 8: Hotspots (siempre crear)
      const hotspotsSheet = (Array.isArray(hotspotsData) && hotspotsData.length > 0)
        ? hotspotsData.map((h: any) => ({
            'ID': h.id || h._id || '',
            'Título': h.title || '',
            'Descripción': h.description || '',
            'Nivel de Peligro': h.dangerlevel || '',
            'Tiempo de Peligro': h.dangertime || '',
            'Fecha': h.date ? new Date(h.date).toLocaleDateString('es-ES') : '',
            'Autor': h.author || ''
          }))
        : [{ 'ID': '', 'Título': '', 'Descripción': '', 'Nivel de Peligro': '', 'Tiempo de Peligro': '', 'Fecha': '', 'Autor': '' }];
      const wsHotspots = XLSX.utils.json_to_sheet(hotspotsSheet);
      XLSX.utils.book_append_sheet(workbook, wsHotspots, 'Puntos Rojos');

      // Hoja 9: Comunidad (siempre crear)
      const communitySheet = (Array.isArray(communityData) && communityData.length > 0)
        ? communityData.map((p: any) => ({
            'ID': p._id || p.id || '',
            'Contenido': p.content || '',
            'Estado': p.status || '',
            'Fecha': p.date ? new Date(p.date).toLocaleDateString('es-ES') : '',
            'Autor': p.author || '',
            'Likes': p.likes || 0
          }))
        : [{ 'ID': '', 'Contenido': '', 'Estado': '', 'Fecha': '', 'Autor': '', 'Likes': '' }];
      const wsCommunity = XLSX.utils.json_to_sheet(communitySheet);
      XLSX.utils.book_append_sheet(workbook, wsCommunity, 'Comunidad');

      // Hoja 10: Buses (siempre crear)
      const busesSheet = (Array.isArray(busesData) && busesData.length > 0)
        ? busesData.map((b: any) => ({
            'ID': b.id || b._id || '',
            'Número de Ruta': b.routeNumber || '',
            'Nombre de Ruta': b.routeName || '',
            'Color de Ruta': b.routeColor || '',
            'Empresa': b.company || '',
            'Capacidad': b.capacity || '',
            'Estado': b.status || 'activo',
            'Conductor': b.driverName || '',
            'Cédula Conductor': b.driverCedula || '',
            'Placa': b.licensePlate || '',
            'Fecha Registro': b.registrationDate ? new Date(b.registrationDate).toLocaleDateString('es-ES') : ''
          }))
        : [{ 'ID': '', 'Número de Ruta': '', 'Nombre de Ruta': '', 'Color de Ruta': '', 'Empresa': '', 'Capacidad': '', 'Estado': '', 'Conductor': '', 'Cédula Conductor': '', 'Placa': '', 'Fecha Registro': '' }];
      const wsBuses = XLSX.utils.json_to_sheet(busesSheet);
      XLSX.utils.book_append_sheet(workbook, wsBuses, 'Buses');

      // Guardar el archivo
      const fileName = `Backup_Completo_COMET_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error al generar backup Excel:', error);
      alert('Error al generar el backup. Por favor, intenta nuevamente.');
    }
  };

  const backupToPDF = async () => {
    try {
      // Mostrar mensaje de carga
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center';
      loadingMsg.innerHTML = '<div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl"><div class="flex items-center space-x-3"><svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-lg font-semibold text-gray-900 dark:text-white">Generando PDF...</span></div></div>';
      document.body.appendChild(loadingMsg);

      // Esperar un poco para que el servidor esté listo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener todos los datos frescos de la base de datos con reintentos
      const fetchWithRetry = async (url: string, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url, {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` }
            });
            if (response.ok) return response;
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        throw new Error('Max retries reached');
      };

      const [reportsRes, usersRes, eventsRes, complaintsRes, newsRes, dangerousRes, securityNewsRes, hotspotsRes, communityRes, busesRes] = await Promise.all([
        fetchWithRetry('/api/reports').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/users').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/events').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/complaints').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/news').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/dangerous-areas').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/security-news').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/security/hotspots').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/forum').catch(() => ({ ok: false } as Response)),
        fetchWithRetry('/api/buses').catch(() => ({ ok: false } as Response))
      ]);

      const reportsData = reportsRes.ok && 'json' in reportsRes ? await reportsRes.json() : [];
      const usersData = usersRes.ok && 'json' in usersRes ? await usersRes.json() : [];
      const eventsData = eventsRes.ok && 'json' in eventsRes ? await eventsRes.json() : [];
      const complaintsData = complaintsRes.ok && 'json' in complaintsRes ? await complaintsRes.json() : [];
      const newsData = newsRes.ok && 'json' in newsRes ? await newsRes.json() : [];
      const dangerousData = dangerousRes.ok && 'json' in dangerousRes ? await dangerousRes.json() : [];
      const securityNewsData = securityNewsRes.ok && 'json' in securityNewsRes ? await securityNewsRes.json() : [];
      const hotspotsData = hotspotsRes.ok && 'json' in hotspotsRes ? await hotspotsRes.json() : [];
      const communityData = communityRes.ok && 'json' in communityRes ? await communityRes.json() : [];
      const busesData = busesRes.ok && 'json' in busesRes ? await busesRes.json() : [];

      // Remover mensaje de carga
      document.body.removeChild(loadingMsg);

      const doc = new jsPDF();
      let currentY = 20;

      // Portada
      doc.setFontSize(22);
      doc.text('Sistema COMET', 105, 30, { align: 'center' });
      doc.setFontSize(18);
      doc.text('Backup Completo del Sistema', 105, 40, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 105, 50, { align: 'center' });

      // Resumen
      currentY = 70;
      doc.setFontSize(14);
      doc.text('Resumen del Sistema', 14, currentY);
      currentY += 10;
      doc.setFontSize(10);
      doc.text(`Total de Reportes: ${Array.isArray(reportsData) ? reportsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Usuarios: ${Array.isArray(usersData) ? usersData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Eventos: ${Array.isArray(eventsData) ? eventsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Quejas: ${Array.isArray(complaintsData) ? complaintsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Noticias: ${Array.isArray(newsData) ? newsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Áreas Peligrosas: ${Array.isArray(dangerousData) ? dangerousData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Noticias de Seguridad: ${Array.isArray(securityNewsData) ? securityNewsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Puntos Rojos: ${Array.isArray(hotspotsData) ? hotspotsData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Publicaciones (Comunidad): ${Array.isArray(communityData) ? communityData.length : 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Total de Buses Registrados: ${Array.isArray(busesData) ? busesData.length : 0}`, 14, currentY);

      // Reportes (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Reportes Ciudadanos', 14, currentY);
      currentY += 10;

      if (Array.isArray(reportsData) && reportsData.length > 0) {
        const reportsTableData = reportsData.map((r: any) => [
          (r.id || '').toString().substring(0, 10),
          (r.title || '').substring(0, 35),
          (r.location || '').substring(0, 25),
          (r.status || '').substring(0, 15),
          r.date ? new Date(r.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Ubicación', 'Estado', 'Fecha']],
          body: reportsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [59, 130, 246] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay reportes registrados', 14, currentY);
      }

      // Usuarios (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Usuarios del Sistema', 14, currentY);
      currentY += 10;

      if (Array.isArray(usersData) && usersData.length > 0) {
        const usersTableData = usersData.map((u: any) => [
          (u.cedula || u.id || '').toString().substring(0, 15),
          (u.name || '').substring(0, 30),
          (u.email || '').substring(0, 30),
          (u.role || '').substring(0, 15),
          u.verified ? 'Sí' : 'No'
        ]);

        autoTable(doc, {
          head: [['Cédula', 'Nombre', 'Email', 'Rol', 'Verificado']],
          body: usersTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [34, 197, 94] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay usuarios registrados', 14, currentY);
      }

      // Eventos (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Eventos Comunitarios', 14, currentY);
      currentY += 10;

      if (Array.isArray(eventsData) && eventsData.length > 0) {
        const eventsTableData = eventsData.map((e: any) => [
          (e.id || '').toString().substring(0, 10),
          (e.title || '').substring(0, 35),
          e.date ? new Date(e.date).toLocaleDateString('es-ES') : '',
          (e.location || '').substring(0, 25),
          (e.attendants || 0).toString()
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Fecha', 'Ubicación', 'Asistentes']],
          body: eventsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [249, 115, 22] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay eventos registrados', 14, currentY);
      }

      // Quejas (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Quejas de Seguridad', 14, currentY);
      currentY += 10;

      if (Array.isArray(complaintsData) && complaintsData.length > 0) {
        const complaintsTableData = complaintsData.map((c: any) => [
          (c.id || '').toString().substring(0, 10),
          (c.title || '').substring(0, 35),
          (c.type || '').substring(0, 20),
          (c.status || '').substring(0, 15),
          c.date ? new Date(c.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Tipo', 'Estado', 'Fecha']],
          body: complaintsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [239, 68, 68] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay quejas registradas', 14, currentY);
      }

      // Noticias (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Noticias Municipales', 14, currentY);
      currentY += 10;

      if (Array.isArray(newsData) && newsData.length > 0) {
        const newsTableData = newsData.map((n: any) => [
          (n.id || '').toString().substring(0, 10),
          (n.title || '').substring(0, 40),
          (n.type || '').substring(0, 20),
          n.insurgent ? 'Sí' : 'No',
          n.date ? new Date(n.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Tipo', 'Urgente', 'Fecha']],
          body: newsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [168, 85, 247] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay noticias registradas', 14, currentY);
      }

      // Áreas Peligrosas (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Áreas Peligrosas', 14, currentY);
      currentY += 10;

      if (Array.isArray(dangerousData) && dangerousData.length > 0) {
        const dangerousTableData = dangerousData.map((d: any) => [
          (d.id || '').toString().substring(0, 10),
          (d.title || '').substring(0, 35),
          (d.location || '').substring(0, 25),
          (d.dangerlevel || '').substring(0, 15),
          d.date ? new Date(d.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Ubicación', 'Nivel', 'Fecha']],
          body: dangerousTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [220, 38, 38] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay áreas peligrosas registradas', 14, currentY);
      }

      // Noticias de Seguridad (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Noticias de Seguridad', 14, currentY);
      currentY += 10;

      if (Array.isArray(securityNewsData) && securityNewsData.length > 0) {
        const securityNewsTableData = securityNewsData.map((s: any) => [
          (s.id || '').toString().substring(0, 10),
          (s.title || '').substring(0, 40),
          (s.type || '').substring(0, 20),
          s.insurgent ? 'Sí' : 'No',
          s.date ? new Date(s.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Tipo', 'Urgente', 'Fecha']],
          body: securityNewsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [220, 38, 38] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay noticias de seguridad registradas', 14, currentY);
      }

      // Hotspots (Puntos Rojos) (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Puntos Rojos (Hotspots)', 14, currentY);
      currentY += 10;

      if (Array.isArray(hotspotsData) && hotspotsData.length > 0) {
        const hotspotsTableData = hotspotsData.map((h: any) => [
          (h.id || h._id || '').toString().substring(0, 10),
          (h.title || '').substring(0, 35),
          (h.dangerlevel || '').substring(0, 15),
          (h.dangertime || '').substring(0, 20),
          h.date ? new Date(h.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Título', 'Nivel de Peligro', 'Tiempo', 'Fecha']],
          body: hotspotsTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [239, 68, 68] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay puntos rojos registrados', 14, currentY);
      }

      // Comunidad (Foro) (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Publicaciones de Comunidad', 14, currentY);
      currentY += 10;

      if (Array.isArray(communityData) && communityData.length > 0) {
        const communityTableData = communityData.map((p: any) => [
          (p._id || p.id || '').toString().substring(0, 10),
          (p.content || '').substring(0, 40),
          (p.author || '').substring(0, 25),
          (p.likes || 0).toString(),
          p.date ? new Date(p.date).toLocaleDateString('es-ES') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Contenido', 'Autor', 'Likes', 'Fecha']],
          body: communityTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [168, 85, 247] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay publicaciones de comunidad', 14, currentY);
      }

      // Buses (siempre crear)
      doc.addPage();
      currentY = 20;
      doc.setFontSize(16);
      doc.text('Buses Registrados', 14, currentY);
      currentY += 10;

      if (Array.isArray(busesData) && busesData.length > 0) {
        const busesTableData = busesData.map((b: any) => [
          (b.routeNumber || '').toString().substring(0, 10),
          (b.routeName || '').substring(0, 30),
          (b.company || '').substring(0, 25),
          (b.licensePlate || '').substring(0, 15),
          (b.status || 'activo').substring(0, 12)
        ]);

        autoTable(doc, {
          head: [['Ruta', 'Nombre Ruta', 'Empresa', 'Placa', 'Estado']],
          body: busesTableData,
          startY: currentY,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [59, 130, 246] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: currentY }
        });
      } else {
        doc.setFontSize(10);
        doc.text('No hay buses registrados', 14, currentY);
      }

      // Guardar el PDF
      const fileName = `Backup_Completo_COMET_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error al generar backup PDF:', error);
      alert('Error al generar el backup. Por favor, intenta nuevamente.');
    }
  };

  const handleBackup = () => {
    setShowBackupModal(true);
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
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner with Logo */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-4 sm:p-6 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-12 sm:h-16 w-12 sm:w-16 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold mb-1 break-words">Sistema de Gestión Municipal</h2>
              <p className="text-xs sm:text-sm text-blue-100 break-words">Plataforma integral de administración - COMET</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl sm:text-3xl font-bold">{new Date().toLocaleDateString('es-ES', { day: 'numeric' })}</div>
            <div className="text-xs sm:text-sm text-blue-100">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-start mb-3 sm:mb-4">
                <div className={`bg-gradient-to-r ${
                  stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stat.color === 'green' ? 'from-green-500 to-green-600' :
                  stat.color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-red-500 to-red-600'
                } p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0`}>
                  <IconComponent className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 break-words">{stat.value}</p>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 break-words">{stat.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nuevo evento (replaces activity chart) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
            <Calendar className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="break-words">Nuevo evento</span>
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
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="pr-0 sm:pr-4">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 break-words">{latest.category || 'Evento'}</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 break-words">{latest.title}</div>
                    {latest.description && (
                      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 break-words">{latest.description}</div>
                    )}
                    <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                        <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1 text-blue-600 dark:text-blue-400 flex-shrink-0" /> <span className="break-words">{latest.date}</span>
                      </span>
                      {latest.location && (
                        <span className="inline-flex items-center bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                          <MapPin className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1 text-blue-600 dark:text-blue-400 flex-shrink-0" /> <span className="break-words">{latest.location}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                        <Users className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-1 text-blue-600 dark:text-blue-400 flex-shrink-0" /> <span className="break-words">{latest.attendees} asistentes</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="h-24 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
            No hay eventos registrados aún.
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 min-w-0">
            <Activity className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="break-words">Actividad Reciente</span>
          </h3>
          <button className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap">Ver todo</button>
        </div>
        <div className="space-y-2 sm:space-y-4">
          {reports.slice(0, 5).map((report, index) => (
            <div 
              key={report.id} 
              className="flex flex-col gap-2 sm:flex-row sm:items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-full flex-shrink-0 w-fit">
                <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 break-words">{report.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 break-words">Por {report.user} • {report.location}</p>
              </div>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 w-fit ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header with Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-xl flex-shrink-0">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-8 sm:h-10 w-8 sm:w-10 object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 break-words">Gestión de Reportes</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">Administra y da seguimiento a todos los reportes ciudadanos</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <button 
              onClick={handleExport}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">Exportar</span>
            </button>
            <button className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-500 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium flex-1 sm:flex-none">
              <RefreshCw className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">Actualizar</span>
            </button>
          </div>
        </div>

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 animate-fadeInUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">Exportar Reportes</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 break-words">
              Selecciona el formato en el que deseas exportar los reportes actuales ({filteredReports.length} reportes).
            </p>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => {
                  exportToExcel();
                  setShowExportModal(false);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">Exportar a Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => {
                  exportToPDF();
                  setShowExportModal(false);
                }}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-red-500 text-white rounded-lg sm:rounded-xl hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 font-medium text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">Exportar a PDF (.pdf)</span>
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-xs sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar reportes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 sm:px-3 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-2.5 sm:px-3 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">Eliminar ({selectedItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
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
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Reporte</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestión de Usuarios</h2>
              <p className="text-gray-600 dark:text-gray-400">Crea usuarios y edita su información</p>
            </div>
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
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{adminEditingUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
              <button onClick={() => setAdminModalOpen(false)} className="text-gray-500 dark:text-gray-400">×</button>
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
                <input value={adminForm.cedula} onChange={e=>setAdminForm({ ...adminForm, cedula: e.target.value })} placeholder="Cédula" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              )}
              {adminEditingUser && (
                <input value={adminForm.cedula} readOnly placeholder="Cédula" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              )}
              <input value={adminForm.name} onChange={e=>setAdminForm({ ...adminForm, name: e.target.value })} placeholder="Nombre" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              <input value={adminForm.lastname} onChange={e=>setAdminForm({ ...adminForm, lastname: e.target.value })} placeholder="Apellido" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              <input value={adminForm.email} onChange={e=>setAdminForm({ ...adminForm, email: e.target.value })} type="email" placeholder="Email" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              <input value={adminForm.password} onChange={e=>setAdminForm({ ...adminForm, password: e.target.value })} type="password" placeholder={adminEditingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" {...(adminEditingUser ? {} : { required: true })} />
              <select value={adminForm.role} onChange={e=>setAdminForm({ ...adminForm, role: e.target.value as User['role'] })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="security">Seguridad</option>
                <option value="news">Noticias</option>
                <option value="reports">Reportes</option>
                <option value="buses">Buses</option>
                <option value="community">Comunidad</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setAdminModalOpen(false)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{adminEditingUser ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cédula</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Verificado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u.cedula || u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100">{u.cedula || u.id}</td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100">{u.name}</td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100 hidden sm:table-cell">{u.email}</td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">{u.role}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {u.verified ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Sí</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">No</span>
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
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors duration-200 p-1 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.cedula || String(u.id))}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Eventos</h2>
              <p className="text-gray-600">Crea y administra eventos comunitarios</p>
            </div>
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Comunidad</h2>
              <p className="text-gray-600">Modera publicaciones y comentarios de la comunidad</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { refreshCommunity(); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${communityLoading ? 'animate-spin' : ''}`} />
              <span>{communityLoading ? 'Actualizando…' : 'Actualizar'}</span>
            </button>
            <button onClick={() => { setEditingCommunityPost(null); setCommunityForm({ content: '', photo_link: '' }); setCommunityModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nueva Publicación</span>
            </button>
          </div>
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
                try {
                  const res = await api(`/forum/${editingCommunityPost._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: communityForm.content, photo_link: communityForm.photo_link, status: communityForm.status }) });
                  if (res.ok) {
                    const updated = await res.json();
                    setCommunityPosts(prev => prev.map(p => (p._id === updated._id) ? updated : p));
                  }
                } finally {
                  // Match approve/reject behavior: always refresh after attempting update
                  try { await refreshCommunity(); } catch {}
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
                  // Reload the table to ensure latest data from backend
                  try { await refreshCommunity(); } catch {}
                }
              }
              setCommunityModalOpen(false);
              setEditingCommunityPost(null);
              setCommunityForm({ content: '', photo_link: '', status: 'pending' });
            }}>
              <textarea value={communityForm.content} onChange={e=>setCommunityForm({ ...communityForm, content: e.target.value })} placeholder="Contenido de la publicación" className="w-full border rounded-lg px-3 py-2" rows={4} required />
              <input value={communityForm.photo_link} onChange={e=>setCommunityForm({ ...communityForm, photo_link: e.target.value })} placeholder="Enlace de imagen (opcional)" className="w-full border rounded-lg px-3 py-2" />
              {editingCommunityPost && (
                <select
                  value={communityForm.status || 'pending'}
                  onChange={(e)=> setCommunityForm({ ...communityForm, status: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              )}
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
                  <button onClick={() => { setEditingCommunityPost(p); setCommunityForm({ content: p.content || '', photo_link: p.photo_link || '', status: (p.status || 'pending') }); setCommunityModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded"><Edit className="h-4 w-4" /></button>
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Noticias</h2>
              <p className="text-gray-600">Publica anuncios municipales</p>
            </div>
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
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 p-2 rounded-xl">
                <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sistema de Buses</h2>
                <p className="text-gray-600 text-sm">Monitoreo en vivo y aprobación de conductores</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <select value={busesFilter} onChange={e=>setBusesFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm flex-1 sm:flex-none">
                <option>Todos</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
              <button onClick={refresh} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4" /> {busesLoading ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </div>
          <div className="mt-2">
            <GoogleMapsProvider apiKey={GOOGLE_MAPS_KEY}>
              <BusesMap buses={filtered} />
            </GoogleMapsProvider>
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Áreas Peligrosas</h2>
              <p className="text-gray-600">Gestiona zonas peligrosas reportadas por la municipalidad</p>
            </div>
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Noticias de Seguridad</h2>
              <p className="text-gray-600">Publica anuncios relacionados a seguridad</p>
            </div>
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
          <div className="flex items-center space-x-4">
            <div className="bg-gray-50 p-2 rounded-xl">
              <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Quejas</h2>
              <p className="text-gray-600">Revisa y actualiza las quejas de seguridad</p>
            </div>
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
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 p-2 rounded-xl">
                <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Puntos Rojos</h2>
                <p className="text-gray-600">Crea y administra zonas peligrosas</p>
              </div>
            </div>
            <button onClick={() => { setEditingHotspot(null); setHotspotForm({ title: '', description: '', date: '', time: '', dangerlevel: 'medium', dangertime: '' }); setHotspotModalOpen(true); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo Hotspot</span>
            </button>
          </div>
          {/* Mapa de Puntos Rojos */}
          <div className="mt-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Mapa de Zonas de Riesgo</h3>
            {(() => {
              const points: HotspotPoint[] = hotspots.map((h:any) => {
                const id = h._id || h.id;
                let lat: number | undefined = undefined; let lng: number | undefined = undefined;
                if (typeof h.lat === 'number' && typeof h.lng === 'number') { lat = h.lat; lng = h.lng; }
                else if (h.lat != null && h.lng != null) {
                  const nlat = Number(h.lat); const nlng = Number(h.lng);
                  if (Number.isFinite(nlat) && Number.isFinite(nlng)) { lat = nlat; lng = nlng; }
                } else if (h.location && Array.isArray(h.location.coordinates) && h.location.coordinates.length === 2) {
                  const [lg, lt] = h.location.coordinates; const nlt = Number(lt), nlg = Number(lg);
                  if (Number.isFinite(nlt) && Number.isFinite(nlg)) { lat = nlt; lng = nlg; }
                }
                return { id: String(id), title: h.title || 'Zona', lat, lng } as HotspotPoint;
              });
              const first = points.find(p => typeof p.lat === 'number' && typeof p.lng === 'number');
              // Debug: surface issues if markers still not rendering
              try { console.debug('[Admin Hotspots Map] points:', points.length, points.slice(0,3)); } catch {}
              return (
                <HotspotsMap
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyDluFc7caulw2jHJKsPM_mGnLa8oLuFgio'}
                  points={points}
                  selected={selectedHotspotCenter ?? (first ? { lat: first.lat as number, lng: first.lng as number } : undefined)}
                  selectedId={selectedHotspotId}
                  showAutocomplete={false}
                />
              );
            })()}
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
                    {/* Ubicar en el mapa */}
                    {(() => {
                      let lat: number | undefined; let lng: number | undefined;
                      if (typeof h.lat === 'number' && typeof h.lng === 'number') { lat = h.lat; lng = h.lng; }
                      else if (h.lat != null && h.lng != null) {
                        const nlat = Number(h.lat); const nlng = Number(h.lng);
                        if (Number.isFinite(nlat) && Number.isFinite(nlng)) { lat = nlat; lng = nlng; }
                      } else if (h.location && Array.isArray(h.location.coordinates) && h.location.coordinates.length === 2) {
                        const [lg, lt] = h.location.coordinates; const nlt = Number(lt), nlg = Number(lg);
                        if (Number.isFinite(nlt) && Number.isFinite(nlg)) { lat = nlt; lng = nlg; }
                      }
                      const hasCoords = typeof lat === 'number' && typeof lng === 'number';
                      return (
                        <button
                          onClick={() => {
                            if (hasCoords) {
                              setSelectedHotspotCenter({ lat: lat as number, lng: lng as number });
                              setSelectedHotspotId(String(id));
                            } else {
                              alert('Este hotspot no tiene coordenadas válidas para ubicar en el mapa.');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 hover:bg-blue-50 rounded"
                          title="Ubicar en el mapa"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      );
                    })()}
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
                        {hotspotComments[String(id)].map((c:any) => {
                          const canDelete = (user?.role === 'admin' || user?.role === 'security') || (user?.cedula && String(c.author) === String(user.cedula));
                          return (
                            <div key={String(c._id || c.id)} className="text-[12px] text-gray-700 flex items-start justify-between gap-2">
                              <div>
                                <span className="font-medium text-gray-900">{c.author || 'anon'}:</span> {c.content}
                                <span className="text-gray-400 ml-2">{new Date(c.date).toLocaleString('es-ES')}</span>
                              </div>
                              {canDelete && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const r = await api(`/security/hotspots/comments/${c._id || c.id}`, { method: 'DELETE' });
                                      if (r.ok) {
                                        setHotspotComments(prev => ({ ...prev, [String(id)]: (prev[String(id)]||[]).filter((x:any) => (String(x._id||x.id) !== String(c._id||c.id))) }));
                                      }
                                    } catch {}
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Eliminar comentario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl">
        <div className="w-full px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-blue-100 text-sm">Bienvenido, {user?.name} • Sistema COMET</p>
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
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 break-words">
              {activeTab === 'dashboard' && 'Dashboard Principal'}
              {activeTab === 'reports' && 'Gestión de Reportes'}
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'complaints' && 'Gestión de Quejas'}
              {activeTab === 'hotspots' && 'Gestión de Puntos Rojos'}
              {activeTab === 'dangerous' && 'Áreas Peligrosas'}
              {activeTab === 'securityNews' && 'Noticias de Seguridad'}
              {activeTab === 'news' && 'Gestión de Noticias'}
              {activeTab === 'buses' && 'Sistema de Buses'}
              {activeTab === 'community' && 'Comunidad'}
              {activeTab === 'events' && 'Gestión de Eventos'}
              {activeTab === 'settings' && 'Configuración del Sistema'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 sm:p-3 rounded-xl flex-shrink-0">
                        <Settings className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">Configuración del Sistema</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ajustes generales de la plataforma</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-xl flex-shrink-0">
                      <img src="/municipality-logo.svg" alt="Logo Municipalidad" className="h-10 sm:h-12 w-10 sm:w-12 object-contain" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                          <svg className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Modo Oscuro</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Tema de la interfaz</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const isDark = localStorage.getItem('darkMode') === 'true';
                          if (isDark) {
                            document.documentElement.classList.remove('dark');
                            localStorage.setItem('darkMode', 'false');
                          } else {
                            document.documentElement.classList.add('dark');
                            localStorage.setItem('darkMode', 'true');
                          }
                        }}
                        className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                      >
                        <span className="text-sm font-medium">Cambiar</span>
                      </button>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Alertas del sistema</p>
                        </div>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                        <span className="text-sm font-medium">Configurar</span>
                      </button>
                    </div>

                    {/* User Management */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer" onClick={() => setActiveTab('users')}>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Administrar cuentas</p>
                        </div>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                        <span className="text-sm font-medium">Ir →</span>
                      </button>
                    </div>

                    {/* Security Settings */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                          <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Seguridad</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Configuración de seguridad</p>
                        </div>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                        <span className="text-sm font-medium">Configurar</span>
                      </button>
                    </div>

                    {/* Database Backup */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer" onClick={handleBackup}>
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg flex-shrink-0">
                          <Download className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Respaldo de Datos</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Backup automático</p>
                        </div>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm font-medium flex-shrink-0">
                        <span>Ejecutar</span>
                      </button>
                    </div>

                    {/* System Reports */}
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200" onClick={() => setActiveTab('reports')}>
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex-shrink-0">
                          <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Reportes del Sistema</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Estadísticas y reportes</p>
                        </div>
                      </div>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-xs sm:text-sm font-medium flex-shrink-0">
                        <span>Ver →</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Información del Sistema</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Versión</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">v1.0.0</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Última actualización</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">5 Nov 2025</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Estado del servidor</p>
                      <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">● Activo</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Backup Completo */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Download className="h-6 w-6 mr-2 text-orange-500" />
                Backup Completo del Sistema
              </h3>
              <button 
                onClick={() => setShowBackupModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                <strong>El backup incluye todas las tablas de la base de datos:</strong>
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4">
                <li>• Reportes ciudadanos</li>
                <li>• Usuarios del sistema (sin contraseñas)</li>
                <li>• Eventos comunitarios</li>
                <li>• Quejas de seguridad</li>
                <li>• Noticias municipales</li>
                <li>• Áreas peligrosas</li>
                <li>• Noticias de seguridad</li>
                <li>• Puntos rojos (hotspots)</li>
                <li>• Publicaciones de comunidad</li>
                <li>• Buses registrados</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
                * Los datos se obtendrán directamente de la base de datos al momento de generar el backup
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Selecciona el formato en el que deseas realizar el backup completo del sistema.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  backupToExcel();
                  setShowBackupModal(false);
                }}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span>Backup en Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => {
                  backupToPDF();
                  setShowBackupModal(false);
                }}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg"
              >
                <Download className="h-5 w-5" />
                <span>Backup en PDF (.pdf)</span>
              </button>

              <button
                onClick={() => setShowBackupModal(false)}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {renderUsersModal()}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-30 shadow-lg">
        <nav className="flex items-center gap-6 w-full sm:max-w-3xl mx-auto justify-start sm:justify-center overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory sm:snap-none" style={{ touchAction: 'pan-x', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
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
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:scale-105'
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