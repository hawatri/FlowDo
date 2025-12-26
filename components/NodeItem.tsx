import React, { useRef, useState } from 'react';
import { Node, NodeType, Attachment } from '../types';
import { NODE_COLORS } from '../constants';
import { 
  Trash2, GripHorizontal, CheckCircle, Circle, RefreshCw, 
  Sparkles, Paperclip, ImageIcon, FileText, Music, Play
} from 'lucide-react';

interface NodeProps {
  node: Node;
  isSelected: boolean;
  scale: number;
  onUpdate: (id: string, data: Partial<Node>) => void;
  onDelete: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onConnectStart: (e: React.MouseEvent, nodeId: string) => void;
  onConnectEnd: (e: React.MouseEvent, nodeId: string) => void;
  onResizeStart: (e: React.MouseEvent, nodeId: string) => void;
  onAttach: (nodeId: string) => void;
  onAIAction: (nodeId: string, action: string) => void;
}

export const NodeItem: React.FC<NodeProps> = ({
  node, isSelected, scale, onUpdate, onDelete, onMouseDown, 
  onConnectStart, onConnectEnd, onResizeStart, onAttach, onAIAction
}) => {
  const styles = NODE_COLORS[node.type];
  const [isHovered, setIsHovered] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(node.id, { 
      data: { ...node.data, isFlipped: !node.data.isFlipped } 
    });
  };

  const renderContent = () => {
    switch (node.type) {
      case 'flashcard':
        return (
          <div className="w-full h-full relative perspective-1000 group cursor-pointer" onClick={handleFlip}>
            <div className={`w-full h-full relative transform-style-3d transition-all duration-500 ${node.data.isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-zinc-900 flex flex-col items-center justify-center p-4 text-center border border-zinc-700 rounded-lg">
                <span className="text-xs font-bold text-emerald-500 uppercase mb-2">Front</span>
                <textarea 
                  className="w-full h-full bg-transparent text-center resize-none outline-none text-zinc-200 placeholder-zinc-600"
                  value={node.data.front}
                  onChange={(e) => onUpdate(node.id, { data: { ...node.data, front: e.target.value } })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter Question..."
                />
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-emerald-900/20 flex flex-col items-center justify-center p-4 text-center border border-emerald-500/30 rounded-lg">
                <span className="text-xs font-bold text-emerald-500 uppercase mb-2">Back</span>
                <textarea 
                  className="w-full h-full bg-transparent text-center resize-none outline-none text-zinc-200 placeholder-zinc-400"
                  value={node.data.back}
                  onChange={(e) => onUpdate(node.id, { data: { ...node.data, back: e.target.value } })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter Answer..."
                />
              </div>
            </div>
          </div>
        );
      case 'quiz':
         return (
             <div className="flex flex-col h-full p-2">
                 <div className="font-semibold text-rose-400 mb-2">AI Quiz Question</div>
                 <div className="text-sm mb-3">{node.data.label}</div>
                 <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                    {node.data.quizOptions?.map((opt, i) => {
                        const isCorrect = opt === node.data.correctAnswer;
                        const isSelected = opt === node.data.userSelectedAnswer;
                        let bgClass = "bg-zinc-800 hover:bg-zinc-700";
                        if (node.data.userSelectedAnswer) {
                            if (isCorrect) bgClass = "bg-green-600 text-white";
                            else if (isSelected) bgClass = "bg-red-600 text-white";
                            else bgClass = "bg-zinc-800 opacity-50";
                        }
                        return (
                            <button 
                                key={i}
                                onClick={(e) => { e.stopPropagation(); if(!node.data.userSelectedAnswer) onUpdate(node.id, { data: {...node.data, userSelectedAnswer: opt}})}}
                                className={`px-3 py-2 rounded text-left text-xs transition-colors ${bgClass}`}
                            >
                                {opt}
                            </button>
                        )
                    })}
                 </div>
             </div>
         );
      default:
        return (
          <textarea
            className="w-full h-full bg-transparent resize-none outline-none text-zinc-300 placeholder-zinc-600 text-sm leading-relaxed p-1 font-mono"
            value={node.data.label}
            onChange={(e) => onUpdate(node.id, { data: { ...node.data, label: e.target.value } })}
            placeholder="Type your notes here..."
            onMouseDown={(e) => e.stopPropagation()}
          />
        );
    }
  };

  return (
    <div
      className={`absolute flex flex-col rounded-xl overflow-hidden node-drag-shadow bg-[#18181b] transition-shadow duration-200`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        border: `1px solid ${isSelected ? styles.border : '#27272a'}`,
        boxShadow: isSelected ? `0 0 0 2px ${styles.border}` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={onMouseDown}
    >
      {/* Header */}
      <div 
        className="h-9 px-3 flex items-center justify-between shrink-0 border-b border-zinc-800"
        style={{ background: `linear-gradient(90deg, ${styles.bg}, transparent)` }}
      >
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.icon }} />
            <input 
                value={node.title}
                onChange={(e) => onUpdate(node.id, { title: e.target.value })}
                className="bg-transparent text-xs font-bold uppercase tracking-wider text-zinc-300 outline-none w-32"
                onMouseDown={(e) => e.stopPropagation()}
            />
        </div>
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={(e) => { e.stopPropagation(); onAIAction(node.id, 'enhance'); }} className="p-1 hover:bg-white/10 rounded text-indigo-400" title="Enhance with AI">
                <Sparkles size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1 hover:bg-white/10 rounded text-red-400">
                <Trash2 size={12} />
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 relative p-3 overflow-hidden flex flex-col">
        {/* Connection Points */}
        <div 
            className="absolute -left-3 top-10 w-6 h-6 rounded-full flex items-center justify-center cursor-crosshair z-20 group/pin"
            onMouseUp={(e) => onConnectEnd(e, node.id)}
        >
             <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full border-2 border-zinc-900 group-hover/pin:scale-125 group-hover/pin:bg-indigo-500 transition-transform"></div>
        </div>
        <div 
            className="absolute -right-3 top-10 w-6 h-6 rounded-full flex items-center justify-center cursor-crosshair z-20 group/pin"
            onMouseDown={(e) => onConnectStart(e, node.id)}
        >
             <div className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-900 group-hover/pin:scale-125 transition-transform ${node.completed ? 'bg-emerald-500' : 'bg-zinc-500 hover:bg-indigo-500'}`}></div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>

        {/* Attachment Bar */}
        {node.data.attachments.length > 0 && (
            <div className="flex gap-1 overflow-x-auto py-2 border-t border-zinc-800/50 mt-1 scrollbar-hide">
                {node.data.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 whitespace-nowrap border border-zinc-700">
                        {att.type === 'image' ? <ImageIcon size={10} className="text-purple-400"/> : <FileText size={10} className="text-blue-400"/>}
                        <span className="truncate max-w-[80px]">{att.name}</span>
                    </div>
                ))}
            </div>
        )}

        {/* Footer */}
        <div className={`pt-2 flex items-center justify-between border-t border-zinc-800/50 mt-1 transition-opacity duration-200 ${isHovered || isSelected ? 'opacity-100' : 'opacity-30'}`}>
            <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); onAttach(node.id); }} className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-300">
                    <Paperclip size={12} />
                </button>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(node.id, { completed: !node.completed }); }}
                    className={`transition-colors ${node.completed ? 'text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    {node.completed ? <CheckCircle size={14} /> : <Circle size={14} />}
                </button>
                <div 
                    className="cursor-nwse-resize text-zinc-600 hover:text-zinc-400"
                    onMouseDown={(e) => onResizeStart(e, node.id)}
                >
                    <GripHorizontal size={14} className="rotate-45" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};