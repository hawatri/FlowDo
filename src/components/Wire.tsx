import React from 'react';
import { COLORS } from '../constants';

interface WireProps {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  status?: 'default' | 'active' | 'locked';
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

export const Wire: React.FC<WireProps> = ({ 
  id, 
  start, 
  end, 
  status = 'default', 
  isSelected, 
  onSelect, 
  onContextMenu 
}) => {
  const dist = Math.abs(end.x - start.x);
  const controlPointX = Math.max(dist * 0.5, 50); 
  const path = `M ${start.x} ${start.y} C ${start.x + controlPointX} ${start.y}, ${end.x - controlPointX} ${end.y}, ${end.x} ${end.y}`;
  
  let strokeColor = '#777';
  let strokeWidth = 3;
  let strokeDash = '';
  let shadowOpacity = 0.2;
  
  if (isSelected) { 
    strokeColor = COLORS.wireSelected; 
    strokeWidth = 4; 
    shadowOpacity = 0.6; 
  } else if (status === 'active') { 
    strokeColor = COLORS.wireActive; 
    strokeWidth = 5; 
    shadowOpacity = 0.4; 
  } else if (status === 'locked') { 
    strokeColor = '#ef4444'; 
    strokeDash = '10,5'; 
    strokeWidth = 3; 
  } else { 
    strokeColor = '#999'; 
    strokeWidth = 3; 
  }
  
  return (
    <g 
      onClick={(e) => { 
        e.stopPropagation(); 
        onSelect(id); 
      }} 
      onContextMenu={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        onContextMenu(e, id); 
      }} 
      className="group"
    >
      <path 
        d={path} 
        fill="none" 
        stroke="transparent" 
        strokeWidth={25} 
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }} 
      />
      <path 
        d={path} 
        fill="none" 
        stroke="#000" 
        strokeWidth={strokeWidth + 3} 
        strokeOpacity={shadowOpacity} 
        strokeLinecap="round" 
        className="pointer-events-none" 
      />
      <path 
        d={path} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth={strokeWidth} 
        strokeDasharray={strokeDash} 
        strokeLinecap="round" 
        className="transition-colors duration-200 pointer-events-none" 
      />
    </g>
  );
};