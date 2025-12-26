import { NodeType } from './types';

export const GRID_SIZE = 24;
export const DEFAULT_NODE_WIDTH = 300;
export const DEFAULT_NODE_HEIGHT = 200;
export const DB_NAME = 'FlowDoDB_V2';
export const SETTINGS_KEY = 'flowdo_settings_v2';

export const COLORS = {
  bg: '#09090b', // Zinc 950
  grid: '#27272a', // Zinc 800
  selection: 'rgba(99, 102, 241, 0.1)', // Indigo with opacity
  wire: '#52525b', // Zinc 600
  wireActive: '#10b981', // Emerald 500
  wireSelected: '#6366f1', // Indigo 500
};

export const NODE_COLORS: Record<NodeType, { border: string; bg: string; icon: string }> = {
  lecture: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: '#a78bfa' }, // Violet
  concept: { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: '#22d3ee' }, // Cyan
  flashcard: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '#34d399' }, // Emerald
  task: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: '#60a5fa' }, // Blue
  quiz: { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', icon: '#fb7185' }, // Rose
};

export const INITIAL_NODES = [
  { 
    id: '1', 
    type: 'lecture' as NodeType, 
    title: 'Welcome to FlowDo', 
    x: 100, 
    y: 100, 
    width: 320, 
    height: 180, 
    completed: false, 
    data: { 
      label: 'This is an infinite canvas for your thoughts.\n\n- Drag to move\n- Right-click to add nodes\n- Connect nodes by dragging from the dots', 
      attachments: [] 
    } 
  },
];
