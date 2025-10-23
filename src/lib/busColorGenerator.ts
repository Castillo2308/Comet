/**
 * Generate a deterministic, unique color for each bus ID
 * Ensures the same bus always gets the same color
 */

const BUS_COLORS = [
  '#FF6B6B', // Rojo
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul cielo
  '#FFA07A', // Salmón
  '#98D8C8', // Menta
  '#F7DC6F', // Amarillo
  '#BB8FCE', // Púrpura
  '#85C1E2', // Azul claro
  '#F8B88B', // Naranja suave
  '#ABEBC6', // Verde claro
  '#F1948A', // Rosa suave
  '#D7BDE2', // Lavanda
];

/**
 * Generate a color based on bus ID
 * Uses simple hash to ensure consistency
 */
export function generateBusColor(busId: string | number): string {
  const id = String(busId);
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % BUS_COLORS.length;
  return BUS_COLORS[index];
}

/**
 * Get a contrasting text color for given background color
 */
export function getContrastingTextColor(bgColor: string): string {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default { generateBusColor, getContrastingTextColor };
