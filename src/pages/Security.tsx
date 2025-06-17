import React, { useState } from 'react';
import { Plus, Shield, AlertTriangle, FileText, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

interface Complaint {
  id: number;
  title: string;
  description: string;
  type: string;
  location: string;
  date: string;
  status: string;
}

export default function Security() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    type: '',
    location: ''
  });

  const complaintTypes = [
    'Robo',
    'Vandalismo',
    'Drogas',
    'Ruido excesivo',
    'Violencia',
    'Otro'
  ];

  const dangerousZones = [
    {
      id: 1,
      name: 'Parque Central',
      description: 'Las noches en este parque pueden ser un poco peligrosas.',
      date: '23 de abril de 2024',
      riskLevel: 'Medio'
    },
    {
      id: 2,
      name: 'Puente del Río',
      description: 'Zona con poca iluminación, reportes de robos.',
      date: '20 de abril de 2024',
      riskLevel: 'Alto'
    }
  ];

  const latestNews = [
    {
      id: 1,
      type: 'Policía',
      title: 'Vigilancia aumentada en el parque',
      description: 'Los oficiales patrullarán el parque este fin de semana a pie.',
      date: '22 de abril de 2024',
      icon: Shield
    },
    {
      id: 2,
      type: 'Policía',
      title: 'Advertencia de estafas telefónicas',
      description: 'Se han reportado varios casos de estafas telefónicas en nuestro cantón.',
      date: '21 de abril de 2024',
      icon: AlertTriangle
    }
  ];

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const newComplaint: Complaint = {
      id: Date.now(),
      ...complaintForm,
      date: new Date().toLocaleDateString('es-ES'),
      status: 'Pendiente'
    };
    setComplaints([newComplaint, ...complaints]);
    setComplaintForm({ title: '', description: '', type: '', location: '' });
    setShowComplaintModal(false);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Alto': return 'bg-red-100 text-red-600';
      case 'Medio': return 'bg-yellow-100 text-yellow-600';
      case 'Bajo': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
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
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Seguridad</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
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
          <button className="bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Añadir Reporte</span>
          </button>
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
                    <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                      {complaint.status}
                    </span>
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

        {/* Dangerous Zones */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Zonas Peligrosas</h2>
          <div className="space-y-2 sm:space-y-3">
            {dangerousZones.map((zone) => (
              <div 
                key={zone.id}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{zone.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(zone.riskLevel)}`}>
                    {zone.riskLevel}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mb-2">{zone.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">{zone.date}</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-500 text-xs">Ver en mapa</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Noticias</h2>
          <div className="space-y-2 sm:space-y-3">
            {latestNews.map((news) => {
              const IconComponent = news.icon;
              return (
                <div 
                  key={news.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full transform transition-transform duration-200 hover:scale-110">
                      <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                          {news.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{news.title}</h3>
                      <p className="text-gray-600 text-xs mb-2">{news.description}</p>
                      <span className="text-gray-400 text-xs">{news.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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