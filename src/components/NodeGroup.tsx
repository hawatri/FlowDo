import React from 'react';
import { GripHorizontal } from 'lucide-react';
import { COLORS } from '../constants';
import type { Group } from '../types';

interface NodeGroupProps {
  group: Group;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, group: Group) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string) => void;
  onUpdateGroup: (id: string, updates: Partial<Group>) => void;
}

export const NodeGroup: React.FC<NodeGroupProps> = ({
  group,
  isSelected,
  onMouseDown,
  onResizeMouseDown,
  onUpdateGroup
}) => {
  const handleTitleChange = (value: string) => {
    onUpdateGroup(group.id, { title: value });
  };

  return (
    <div 
      className="absolute border flex flex-col group/groupbox" 
      style={{ 
        left: group.x, 
        top: group.y, 
        width: group.width, 
        height: group.height, 
        backgroundColor: COLORS.groupBg, 
        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)', 
        borderRadius: '16px', 
        zIndex: 0 
      }} 
      onMouseDown={(e) => onMouseDown(e, group)}
    >
      <div 
        className="px-4 py-2 rounded-t-2xl font-bold text-lg text-white/50 hover:text-white transition-colors cursor-grab active:cursor-grabbing" 
        style={{ backgroundColor: group.color }}
      >
        <input 
          value={group.title} 
          onChange={(e) => handleTitleChange(e.target.value)} 
          className="bg-transparent border-none focus:outline-none w-full cursor-text" 
          onMouseDown={(e) => e.stopPropagation()} 
        />
      </div>
      <div 
        className="absolute bottom-2 right-2 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-zinc-600 hover:text-white z-10" 
        onMouseDown={(e) => onResizeMouseDown(e, group.id)}
      >
        <GripHorizontal size={20} className="rotate-45" />
      </div>
    </div>
  );
};