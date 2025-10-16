export default function ChatbotToggle() {
  return (
    <button
      id="bp-toggle-chat"
      className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 z-40 flex items-center justify-center group"
      aria-label="Toggle Chatbot"
    >
      {/* Chat Icon SVG */}
      <svg
        className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      
      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
    </button>
  );
}
