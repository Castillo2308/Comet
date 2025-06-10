import React, { useEffect, useState } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface CircularMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export default function CircularMenu({ items, isOpen, onClose, triggerRef }: CircularMenuProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      setPosition({
        x: centerX,
        y: centerY
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  const radius = 50;
  const angleStep = (2 * Math.PI) / items.length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />
      
      {/* Menu Items */}
      <div 
        className="fixed z-50"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {items.map((item, index) => {
          const angle = angleStep * index - Math.PI / 2; // Start from top
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius - 20; // Move up to avoid bottom nav
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="absolute bg-white border border-gray-200 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-110 active:scale-95"
              style={{
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                animation: `circularMenuItemAppear 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <IconComponent className="h-5 w-5 text-gray-600" />
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}