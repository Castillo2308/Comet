import { X, HelpCircle, MessageSquare, Settings, Info, Phone } from 'lucide-react';
import { useState } from 'react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function SideMenu({ isOpen, onClose, onOpenSettings }: SideMenuProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const menuItems = [
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Ayuda y Soporte',
      description: 'Encuentra respuestas a tus preguntas',
      action: () => console.log('Ayuda clicked')
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
      action: () => console.log('About clicked')
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
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
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
    </>
  );
}