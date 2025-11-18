import { X, HelpCircle, MessageSquare, Settings, Info, Phone, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function SideMenu({ isOpen, onClose, onOpenSettings }: SideMenuProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Ayuda y Soporte',
      description: 'Encuentra respuestas a tus preguntas',
      action: () => setShowHelp(true)
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      label: 'WhatsApp',
      description: 'Contacta por WhatsApp',
      action: () => window.open('https://wa.me/+50687398074', '_blank')
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Configuración',
      description: 'Ajusta tus preferencias',
      action: () => {
        onOpenSettings();
        onClose();
      }
    },
    {
      id: 'about',
      icon: Info,
      label: 'Acerca de',
      description: 'Información sobre la app',
      action: () => setShowAbout(true)
    },
    {
      id: 'contact',
      icon: Phone,
      label: 'Contacto',
      description: 'Información de contacto',
      action: () => console.log('Contact clicked')
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Side Menu */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out animate-slideInRight">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600">
            <div>
              <h2 className="text-lg font-bold text-white">Menú</h2>
              <p className="text-blue-100 text-sm">Opciones y configuración</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const shouldCloseMenu = !['help', 'about'].includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      if (shouldCloseMenu) {
                        onClose();
                      }
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left hover:bg-gray-50 hover:shadow-sm active:scale-98"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {item.label}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center p-2">
                  <img src="/municipality-logo.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">COMET</h3>
              </div>
              <p className="text-gray-600 text-xs mb-2">Versión 1.0.0</p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <button 
                  onClick={() => setShowTerms(true)}
                  className="hover:text-blue-500 transition-colors duration-200"
                >
                  Términos
                </button>
                <span>•</span>
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="hover:text-blue-500 transition-colors duration-200"
                >
                  Privacidad
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Términos de Servicio</h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">1. Aceptación de Términos</h3>
                  <p>Al acceder y utilizar la aplicación COMET, aceptas estar sujeto a estos términos de servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes usar la aplicación.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">2. Descripción del Servicio</h3>
                  <p>COMET es una plataforma digital municipal que facilita la comunicación entre ciudadanos y autoridades locales. Proporciona funcionalidades para reportar problemas, acceder a información municipal, consultar sobre eventos, transporte y seguridad.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">3. Uso Responsable</h3>
                  <p>Los usuarios se comprometen a utilizar la aplicación de manera responsable y legal. Se prohíbe:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
                    <li>Subir contenido ofensivo, ilegal o discriminatorio</li>
                    <li>Compartir información personal de terceros sin consentimiento</li>
                    <li>Usar la plataforma para acoso o intimidación</li>
                    <li>Intentar acceder a áreas restringidas del sistema</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">4. Limitación de Responsabilidad</h3>
                  <p>La municipalidad no se responsabiliza por daños indirectos, incidentales, especiales o consecuentes derivados del uso de la aplicación.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">5. Modificaciones</h3>
                  <p>La municipalidad se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán efectivos inmediatamente después de su publicación.</p>
                </section>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Política de Privacidad</h2>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">1. Recopilación de Datos</h3>
                  <p>COMET recopila información que proporcionas voluntariamente al registrarte, incluyendo nombre, correo electrónico y cédula de identidad. También recopilamos datos de uso para mejorar la experiencia del usuario.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">2. Uso de Información</h3>
                  <p>Tu información se utiliza para:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1 mt-2">
                    <li>Gestionar tu cuenta y acceso a la plataforma</li>
                    <li>Procesar reportes y solicitudes</li>
                    <li>Comunicarte sobre actualizaciones y notificaciones</li>
                    <li>Mejorar y optimizar la aplicación</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">3. Protección de Datos</h3>
                  <p>Implementamos medidas de seguridad para proteger tu información personal. Sin embargo, ningún método de transmisión por internet es 100% seguro.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">4. Cookies y Tecnologías Similares</h3>
                  <p>Utilizamos cookies para mantener tu sesión y recordar preferencias. Puedes desactivar las cookies en tu navegador, aunque esto puede afectar la funcionalidad de la aplicación.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">5. Derechos del Usuario</h3>
                  <p>Tienes derecho a acceder, corregir o solicitar la eliminación de tus datos personales. Contáctanos para ejercer estos derechos.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">6. Cambios a esta Política</h3>
                  <p>La municipalidad puede actualizar esta política en cualquier momento. Te notificaremos sobre cambios significativos publicando la nueva política en la aplicación.</p>
                </section>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ayuda y Soporte</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Preguntas Frecuentes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* FAQ Content */}
              <div className="space-y-3">
                {[
                  {
                    id: 'q1',
                    question: '¿Cómo registro mi cuenta?',
                    answer: 'Puedes registrarte en la pantalla de inicio usando tu correo electrónico y cédula de identidad. Verifica tu correo y completa tu perfil.'
                  },
                  {
                    id: 'q2',
                    question: '¿Cómo reporto un problema?',
                    answer: 'Toca el botón "+" en la barra inferior, selecciona el tipo de problema, añade una descripción y ubicación (opcional). El reporte será enviado a las autoridades.'
                  },
                  {
                    id: 'q3',
                    question: '¿Cómo veo el estado de mis reportes?',
                    answer: 'Ve a la sección "Reportes" en el menú. Allí podrás ver todos tus reportes y su estado actual (Pendiente, En Proceso, Resuelto).'
                  },
                  {
                    id: 'q4',
                    question: '¿Dónde veo los eventos municipales?',
                    answer: 'En la sección "Eventos" puedes ver todos los eventos próximos, sus fechas, ubicaciones y detalles. Puedes marcar tu asistencia.'
                  },
                  {
                    id: 'q5',
                    question: '¿Cómo veo la información de buses?',
                    answer: 'En la sección "Buses" encuentras información sobre rutas, horarios y ubicación en tiempo real de los autobuses municipales.'
                  },
                  {
                    id: 'q6',
                    question: '¿Qué son los "Puntos Rojos"?',
                    answer: 'Son áreas con alta incidencia de inseguridad reportadas por ciudadanos. Te ayudan a identificar zonas de riesgo en tu municipio.'
                  },
                  {
                    id: 'q7',
                    question: '¿Cómo cambio mi contraseña?',
                    answer: 'Ve a Configuración > Cambiar Contraseña. Ingresa tu contraseña actual y luego crea una nueva más segura.'
                  },
                  {
                    id: 'q8',
                    question: '¿Cómo desactivo las notificaciones?',
                    answer: 'Ve a Configuración > Notificaciones y desactiva el toggle. Así no recibirás alertas de nuevos eventos.'
                  },
                  {
                    id: 'q9',
                    question: '¿La app funciona sin internet?',
                    answer: 'No, COMET requiere conexión a internet para funcionar correctamente, ya que sincroniza datos en tiempo real.'
                  },
                  {
                    id: 'q10',
                    question: '¿Es segura mi información personal?',
                    answer: 'Sí, tus datos están protegidos con encriptación. Consulta nuestra Política de Privacidad para más detalles.'
                  }
                ].map((faq) => (
                  <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white text-left">{faq.question}</h3>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                          expandedFaq === faq.id ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">¿Aún tienes dudas? Contáctanos:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.open('https://wa.me/+50687398074', '_blank');
                      setShowHelp(false);
                    }}
                    className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-scaleIn shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Info className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acerca de COMET</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">v1.0.0</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6 text-gray-700 dark:text-gray-300">
                {/* What is COMET */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">¿Qué es COMET?</h3>
                  <p className="text-sm leading-relaxed">
                    COMET es una plataforma digital innovadora diseñada para fortalecer la comunicación entre ciudadanos y autoridades municipales. Actúa como un puente tecnológico que facilita el diálogo bidireccional y la participación cívica activa en la gestión local.
                  </p>
                </section>

                {/* Why COMET */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">¿Por qué COMET?</h3>
                  <ul className="text-sm space-y-2 list-disc list-inside">
                    <li><strong>Transparencia:</strong> Acceso a información municipal en tiempo real</li>
                    <li><strong>Participación:</strong> Los ciudadanos pueden reportar problemas directamente</li>
                    <li><strong>Eficiencia:</strong> Respuesta rápida a reportes y solicitudes</li>
                    <li><strong>Seguridad:</strong> Información sobre áreas seguras y eventos de riesgo</li>
                    <li><strong>Comunidad:</strong> Espacios para interacción y colaboración ciudadana</li>
                  </ul>
                </section>

                {/* What COMET does */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">¿Qué puedo hacer en COMET?</h3>
                  <div className="text-sm space-y-2">
                    <p>✓ <strong>Reportar problemas:</strong> Infraestructura, seguridad, servicios</p>
                    <p>✓ <strong>Consultar eventos:</strong> Actividades municipales y comunitarias</p>
                    <p>✓ <strong>Ver información de transporte:</strong> Rutas y horarios de buses</p>
                    <p>✓ <strong>Identificar zonas seguras:</strong> Mapa de puntos rojos de inseguridad</p>
                    <p>✓ <strong>Conectar con la comunidad:</strong> Foros y espacios de diálogo</p>
                    <p>✓ <strong>Recibir noticias:</strong> Actualizaciones importantes de la municipalidad</p>
                  </div>
                </section>

                {/* For whom */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">¿Para quién es COMET?</h3>
                  <div className="text-sm space-y-2">
                    <p><strong className="text-blue-600 dark:text-blue-400">👥 Ciudadanos:</strong> Pueden reportar problemas, participar en consultas y estar informados</p>
                    <p><strong className="text-green-600 dark:text-green-400">🏛️ Autoridades:</strong> Pueden gestionar reportes, comunicarse con ciudadanos y mejorar servicios</p>
                    <p><strong className="text-orange-600 dark:text-orange-400">🚔 Seguridad:</strong> Acceso a información de incidentes y áreas de riesgo</p>
                    <p><strong className="text-purple-600 dark:text-purple-400">📰 Comunicación:</strong> Difusión de noticias e información municipal importante</p>
                  </div>
                </section>

                {/* Vision */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Nuestra Visión</h3>
                  <p className="text-sm leading-relaxed italic">
                    "Una municipalidad más conectada, transparente y responsiva, donde los ciudadanos tienen voz en la toma de decisiones y las autoridades pueden servir mejor a su comunidad."
                  </p>
                </section>

                {/* Technology */}
                <section>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Tecnología</h3>
                  <p className="text-sm leading-relaxed">
                    COMET está desarrollada con tecnologías modernas: React para la interfaz, Node.js en el backend, y PostgreSQL para gestionar datos de manera segura y confiable.
                  </p>
                </section>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowAbout(false)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}