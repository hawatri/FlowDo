import type { Node, Edge, Group } from '../types';

export const initialNodes: Node[] = [
  { 
    id: '1', 
    type: 'lecture', 
    title: 'Physics 101: Mechanics', 
    x: 100, 
    y: 300, 
    width: 260, 
    height: 160, 
    completed: false, 
    data: { 
      label: 'Chapter 1: Newton\'s Laws\nProf. Smith', 
      attachments: [] 
    } 
  },
  { 
    id: '2', 
    type: 'concept', 
    title: 'Newton\'s First Law', 
    x: 450, 
    y: 150, 
    width: 260, 
    height: 180, 
    completed: false, 
    data: { 
      label: 'An object remains at rest or in uniform motion unless acted upon by a force.', 
      attachments: [] 
    } 
  },
  { 
    id: '3', 
    type: 'question', 
    title: 'Quiz Prep', 
    x: 450, 
    y: 450, 
    width: 260, 
    height: 160, 
    completed: false, 
    data: { 
      label: 'What is the difference between mass and weight?', 
      attachments: [] 
    } 
  },
  { 
    id: '4', 
    type: 'summary', 
    title: 'Lecture Summary', 
    x: 800, 
    y: 300, 
    width: 280, 
    height: 200, 
    completed: false, 
    data: { 
      label: 'Key takeaways:\n1. Inertia matches mass\n2. F=ma is crucial\n3. Action = Reaction', 
      attachments: [] 
    } 
  },
];

export const initialEdges: Edge[] = [
  { id: 'e1', source: '1', target: '2' },
  { id: 'e2', source: '1', target: '3' },
  { id: 'e3', source: '2', target: '4' },
  { id: 'e4', source: '3', target: '4' },
];

export const initialGroups: Group[] = [
  { 
    id: 'g1', 
    title: 'Week 1 Material', 
    x: 50, 
    y: 100, 
    width: 1100, 
    height: 600, 
    color: 'rgba(255, 255, 255, 0.1)' 
  }
];