import { useEffect, useState } from 'react';
import { Plus, Shield, AlertTriangle, FileText, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';
import ReportModal from '../components/ReportModal';

interface Complaint {
  id: string | number;
  title: string;
  description: string;
  type: string;
  location: string;
  date: string;
  status: string;
}

interface DangerZone {
  id: string;
  name: string;
  description: string;
  date: string;
  riskLevel: 'Alto' | 'Medio' | 'Bajo';
  location?: string;
}

export default function Security() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dangerousAreas, setDangerousAreas] = useState<DangerZone[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [securityNews, setSecurityNews] = useState<any[]>([]);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    type: '',
    location: ''
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const deleteComplaint = async (id: string | number) => {
    try { await fetch(`/api/complaints/${id}`, { method: 'DELETE' }); } catch {}
    setComplaints(prev => prev.filter(c => c.id !== id));
  };

  const complaintTypes = [
    'Robo',
    'Vandalismo',
    'Drogas',
    'Ruido excesivo',
    'Violencia',
    'Otro'
  ];

  // Load complaints (for this user), hotspots, dangerous areas and news
  useEffect(() => {
    // Dangerous areas from Postgres
    fetch('/api/dangerous-areas')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const riskMap: Record<string, DangerZone['riskLevel']> = { high: 'Alto', medium: 'Medio', low: 'Bajo', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
        const mapped: DangerZone[] = rows.map((d: any) => ({
          id: String(d.id),
          name: d.title || 'Zona',
          description: d.description || '',
          date: new Date(d.date).toLocaleDateString('es-ES'),
          riskLevel: riskMap[(d.dangerlevel || '').toLowerCase()] || 'Medio',
          location: d.location || d.title || ''
        }));
        setDangerousAreas(mapped);
      })
      .catch(() => {});

    // Complaints from Postgres (filter by author)
    fetch('/api/complaints')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const my = rows.filter(rp => !user?.cedula || rp.author === user?.cedula);
        const mapped: Complaint[] = my.map((rp: any) => ({
          id: rp.id,
          title: rp.title,
          description: rp.description,
          type: rp.type,
          location: rp.location,
          date: new Date(rp.date).toLocaleDateString('es-ES'),
          status: rp.status || 'Pendiente',
        }));
        setComplaints(mapped);
      })
      .catch(() => {});

    // Municipal news
    fetch('/api/news')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        setNews(rows.slice(0, 5));
      })
      .catch(() => {});

    // Security news
    fetch('/api/security-news')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => { if (Array.isArray(rows)) setSecurityNews(rows.slice(0,5)); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.cedula]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: complaintForm.type,
      title: complaintForm.title,
      description: complaintForm.description,
      location: complaintForm.location,
      date: new Date().toISOString(),
  status: 'Pendiente',
      photo_link: null,
      author: user?.cedula || 'anon'
    };
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        const mapped: Complaint = {
          id: created.id,
          title: created.title,
          description: created.description,
          type: created.type,
          location: created.location,
          date: new Date(created.date).toLocaleDateString('es-ES'),
          status: created.status || 'Pendiente'
        };
        setComplaints(prev => [mapped, ...prev]);
        setComplaintForm({ title: '', description: '', type: '', location: '' });
        setShowComplaintModal(false);
      }
    } catch {
      // swallow
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Alto': return 'bg-red-100 text-red-600';
      case 'Medio': return 'bg-yellow-100 text-yellow-600';
      case 'Bajo': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusPill = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pend')) return 'bg-yellow-100 text-yellow-700';
    if (s.includes('proce')) return 'bg-blue-100 text-blue-700';
    if (s.includes('resuel') || s.includes('resol')) return 'bg-green-100 text-green-700';
    if (s.includes('rechaz')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fadeIn">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Presentar Queja</h2>
                    <p className="text-sm text-gray-600">Reporta un problema de seguridad</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-5 w-5 text-gray-500 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título de la queja"
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  required
                />

                <textarea
                  placeholder="Descripción detallada"
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50"
                  required
                />

                <select
                  value={complaintForm.type}
                  onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  required
                >
                  <option value="">Tipo de incidente</option>
                  {complaintTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Ubicación del incidente"
                  value={complaintForm.location}
                  onChange={(e) => setComplaintForm({ ...complaintForm, location: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  required
                />

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
                  >
                    Enviar Queja
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Police Logo beside title */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-lg flex items-center justify-center p-2 border-2 border-blue-100">
              <img src="/police-logo.svg" alt="Police Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-blue-600">Seguridad</h1>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Aquí puedes mantenerte al tanto sobre la seguridad del cantón.</p>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Action Buttons */}
        <section className="animate-fadeInUp grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowComplaintModal(true)}
            className="bg-red-500 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-red-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Presentar Queja</span>
          </button>
          <button onClick={() => setShowReportModal(true)} className="bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Añadir Reporte</span>
          </button>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={() => {
          // Dashboard consumes “Tus Reportes”. Here we just close the modal.
          setShowReportModal(false);
        }}
      />
        </section>

        {/* My Complaints */}
        {complaints.length > 0 && (
          <section className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Mis Quejas</h2>
            <div className="space-y-2">
              {complaints.map((complaint) => (
                <div 
                  key={complaint.id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{complaint.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusPill(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <button
                        onClick={() => deleteComplaint(complaint.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Eliminar"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{complaint.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{complaint.type} • {complaint.location}</span>
                    <span>{complaint.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotspots (Puntos Rojos) are shown only in the dedicated tab, not here */}

        {/* Dangerous Areas from Postgres */}
        {dangerousAreas.length > 0 && (
          <section className="animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Áreas Peligrosas (Municipalidad)</h2>
            <div className="space-y-2 sm:space-y-3">
              {dangerousAreas.map((zone) => (
                <div key={zone.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{zone.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(zone.riskLevel)}`}>{zone.riskLevel}</span>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">{zone.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{zone.date}</span>
                    <a className="flex items-center space-x-1 text-blue-500 text-xs hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.location || zone.name)}`} target="_blank" rel="noreferrer">
                      <MapPin className="h-3 w-3" />
                      <span>Ver en mapa</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest News */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Noticias</h2>
          <div className="space-y-2 sm:space-y-3">
            {news.map((n) => {
              const isPolice = (n.type || '').toLowerCase() === 'policía' || (n.type || '').toLowerCase() === 'policia';
              const IconComponent = isPolice ? Shield : AlertTriangle;
              return (
                <div 
                  key={n.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full transform transition-transform duration-200 hover:scale-110">
                      <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {n.type && (
                          <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                            {n.type}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{n.title}</h3>
                      <p className="text-gray-600 text-xs mb-2">{n.description}</p>
                      <span className="text-gray-400 text-xs">{new Date(n.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {news.length === 0 && (
              <div className="text-center text-xs text-gray-500">Sin noticias por ahora.</div>
            )}
          </div>
        </section>

        {/* Security News */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Noticias de Seguridad</h2>
          <div className="space-y-2 sm:space-y-3">
            {securityNews.map((n) => (
              <div key={n.id} className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm border ${n.insurgent ? 'border-red-200' : 'border-gray-100'} hover:shadow-md`}>
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-full"><Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {n.type && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-medium">{n.type}</span>}
                      {n.insurgent && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Urgente</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{n.title}</h3>
                    <p className="text-gray-600 text-xs mb-2">{n.description}</p>
                    <span className="text-gray-400 text-xs">{new Date(n.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
            {securityNews.length === 0 && (
              <div className="text-center text-xs text-gray-500">Sin noticias de seguridad.</div>
            )}
          </div>
        </section>

        {/* Emergency Contacts */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h3 className="font-semibold text-red-900 mb-2 text-sm flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Contactos de Emergencia
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-red-800">Policía</div>
                <div className="text-red-600">911</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-red-800">Bomberos</div>
                <div className="text-red-600">911</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-red-800">Cruz Roja</div>
                <div className="text-red-600">911</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-red-800">Fuerza Pública</div>
                <div className="text-red-600">2295-3000</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}