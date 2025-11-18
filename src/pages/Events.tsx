import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, Filter, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  maxAttendees?: number;
  organizer: string;
  price: string;
  rating: number;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Feria de Emprendedores',
    description: 'Feria local donde emprendedores de Alajuelita muestran sus productos y servicios.',
    date: '2024-02-15',
    time: '09:00 AM',
    location: 'Centro Comunal de Alajuelita',
    category: 'Comercio',
    attendees: 45,
    maxAttendees: 100,
    organizer: 'Municipalidad de Alajuelita',
    price: 'Gratis',
    rating: 4.8
  },
  {
    id: 2,
    title: 'Festival Cultural',
    description: 'Celebración de la cultura local con música, danza y gastronomía típica.',
    date: '2024-02-20',
    time: '06:00 PM',
    location: 'Parque Central',
    category: 'Cultural',
    attendees: 120,
    maxAttendees: 200,
    organizer: 'Casa de la Cultura',
    price: 'Gratis',
    rating: 4.9
  },
  {
    id: 3,
    title: 'Torneo de Fútbol Comunitario',
    description: 'Torneo deportivo entre los diferentes barrios de Alajuelita.',
    date: '2024-02-25',
    time: '02:00 PM',
    location: 'Estadio Municipal',
    category: 'Deportes',
    attendees: 80,
    maxAttendees: 150,
    organizer: 'Liga Deportiva Local',
    price: '₡1,000',
    rating: 4.6
  },
  {
    id: 4,
    title: 'Taller de Reciclaje',
    description: 'Aprende técnicas de reciclaje y cuidado del medio ambiente.',
    date: '2024-03-01',
    time: '10:00 AM',
    location: 'Escuela Central',
    category: 'Educativo',
    attendees: 25,
    maxAttendees: 40,
    organizer: 'Grupo Ecológico',
    price: 'Gratis',
    rating: 4.7
  }
];

const categories = ['Todos', 'Cultural', 'Deportes', 'Comercio', 'Educativo', 'Social'];

export default function Events() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  useEffect(() => {
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          const mapped: Event[] = rows.map((e:any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: new Date(e.date).toISOString().slice(0,10),
            time: new Date(e.date).toLocaleTimeString(),
            location: e.location,
            category: e.type || 'Social',
            attendees: Number(e.attendants) || 0,
            organizer: e.host || 'Municipalidad',
            price: e.price ? `₡${e.price}` : 'Gratis',
            rating: 4.5
          }));
          setEvents(mapped);
        }
      })
      .catch(()=>{});
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Interactions disabled by design (no asistir/favoritos/compartir)

  const getCategoryColor = (category: string) => {
    const colors = {
      'Cultural': 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
      'Deportes': 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300',
      'Comercio': 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
      'Educativo': 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
      'Social': 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header - standardized to Buses style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-5 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Eventos</h1>
              <p className="text-blue-100 text-sm">Descubre eventos en tu comunidad</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-white text-blue-700 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md hover:bg-blue-50 transition-all duration-200"
          >
            {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4">
        {/* Search and Filters */}
        <section className="animate-fadeInUp">
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                showFilters ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="animate-slideInRight">
              <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Events Grid */}
        <section className="space-y-4">
          {filteredEvents.map((event, index) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Event Header with Category Badge */}
              <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                  </span>
                
                </div>
              </div>

              {/* Event Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{event.title}</h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{event.description}</p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span>{new Date(event.date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span>{event.attendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} asistentes</span>
                  </div>
                </div>

                {/* Event Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Por {event.organizer}</span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">{event.price}</span>
                  </div>
                  {/* Asistir button removed */}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* No Results */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 animate-fadeInUp">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No se encontraron eventos</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Intenta cambiar los filtros o buscar algo diferente</p>
          </div>
        )}

        {/* Quick Stats simplified: only total events */}
        <section className="animate-fadeInUp bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Estadísticas de Eventos</h3>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{events.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Eventos</div>
          </div>
        </section>
      </div>
    </div>
  );
}