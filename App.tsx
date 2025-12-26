import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Grid, Users, Plus, Minus, Settings, Bot, Timer, 
    MousePointer2, Eraser, Download, Share2, Sparkles, X, Layout, Play
} from 'lucide-react';
import { INITIAL_NODES, GRID_SIZE, NODE_COLORS, DB_NAME, SETTINGS_KEY, DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, COLORS } from './constants';
import { Node, Edge, Viewport, DragState, Group, NodeType, ChatMessage } from './types';
import { NodeItem } from './components/NodeItem';
import { generateText, generateFlashcards, generateQuiz } from './services/geminiService';

// --- Helper for IDs ---
const uuid = () => Math.random().toString(36).substr(2, 9);

export default function App() {
    // --- State ---
    const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
    const [selection, setSelection] = useState<string | null>(null);
    
    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ id: 'init', role: 'model', text: 'Hello! I am FlowDo AI. How can I help you study today?', timestamp: Date.now() }]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [timerState, setTimerState] = useState<{time: number, active: boolean}>({ time: 25*60, active: false });
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, canvasX: number, canvasY: number} | null>(null);

    // Interaction Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const connectingRef = useRef<{ source: string, currentX: number, currentY: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeUploadNodeId = useRef<string | null>(null);

    // --- Persistence ---
    useEffect(() => {
        // Simple persistence for demo
        const saved = localStorage.getItem(DB_NAME);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setGroups(data.groups || []);
            } catch (e) { console.error("Load failed", e); }
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            localStorage.setItem(DB_NAME, JSON.stringify({ nodes, edges, groups }));
        }, 1000);
        return () => clearTimeout(t);
    }, [nodes, edges, groups]);

    // --- Timer Logic ---
    useEffect(() => {
        let interval: any;
        if (timerState.active && timerState.time > 0) {
            interval = setInterval(() => setTimerState(p => ({ ...p, time: p.time - 1 })), 1000);
        } else if (timerState.time === 0) {
             setTimerState(p => ({...p, active: false}));
             // Play sound or notify
        }
        return () => clearInterval(interval);
    }, [timerState.active, timerState.time]);

    // --- Geometry Helpers ---
    const screenToCanvas = (sx: number, sy: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (sx - rect.left - viewport.x) / viewport.zoom,
            y: (sy - rect.top - viewport.y) / viewport.zoom
        };
    };

    // --- Event Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // Middle click or space+click (simulated here by context) usually pans, 
        // but for simplicity left click on empty space pans
        if (e.button === 0 && e.target === canvasRef.current) {
            dragStateRef.current = { type: 'canvas', startX: e.clientX, startY: e.clientY };
            setSelection(null);
            setContextMenu(null);
        } else if (e.button === 2) {
            e.preventDefault();
            const pos = screenToCanvas(e.clientX, e.clientY);
            setContextMenu({ x: e.clientX, y: e.clientY, canvasX: pos.x, canvasY: pos.y });
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (e.button === 0) {
            dragStateRef.current = { type: 'node', id, startX: e.clientX, startY: e.clientY };
            setSelection(id);
            setContextMenu(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const ds = dragStateRef.current;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Handle Connecting Line Drawing
        if (connectingRef.current) {
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            connectingRef.current = { ...connectingRef.current, currentX: x, currentY: y };
            // Force re-render for line update
            setViewport(v => ({ ...v })); 
        }

        if (!ds) return;

        const dx = e.clientX - ds.startX;
        const dy = e.clientY - ds.startY;
        
        if (ds.type === 'canvas') {
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            ds.startX = e.clientX;
            ds.startY = e.clientY;
        } else if (ds.type === 'node' && ds.id) {
            const scale = viewport.zoom;
            setNodes(prev => prev.map(n => n.id === ds.id ? { ...n, x: n.x + dx / scale, y: n.y + dy / scale } : n));
            ds.startX = e.clientX;
            ds.startY = e.clientY;
        } else if (ds.type === 'resizeNode' && ds.id) {
            const scale = viewport.zoom;
            setNodes(prev => prev.map(n => n.id === ds.id ? { 
                ...n, 
                width: Math.max(200, n.width + dx / scale), 
                height: Math.max(100, n.height + dy / scale) 
            } : n));
            ds.startX = e.clientX;
            ds.startY = e.clientY;
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        dragStateRef.current = null;
        if (connectingRef.current) {
            // Check if dropped on a node
            // Note: Simplistic hit testing. Ideally, onConnectEnd in Node handles this.
            connectingRef.current = null;
            setViewport(v => ({...v})); // cleanup render
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const newZoom = Math.min(Math.max(0.1, viewport.zoom - e.deltaY * zoomSensitivity), 3);
            
            // Zoom towards pointer could be implemented here, centering for now
            setViewport(prev => ({ ...prev, zoom: newZoom }));
        } else {
            setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    // --- Node Logic ---
    const addNode = (type: NodeType, x: number, y: number) => {
        const newNode: Node = {
            id: uuid(),
            type,
            title: type === 'flashcard' ? 'Flashcard' : 'Untitled',
            x,
            y,
            width: DEFAULT_NODE_WIDTH,
            height: type === 'flashcard' ? 220 : DEFAULT_NODE_HEIGHT,
            completed: false,
            data: { label: '', attachments: [], front: '', back: '' }
        };
        setNodes(p => [...p, newNode]);
        setContextMenu(null);
    };

    const deleteNode = (id: string) => {
        setNodes(p => p.filter(n => n.id !== id));
        setEdges(p => p.filter(e => e.source !== id && e.target !== id));
    };

    const updateNode = (id: string, data: Partial<Node>) => {
        setNodes(p => p.map(n => n.id === id ? { ...n, ...data } : n));
    };

    // --- Edge Logic ---
    const startConnect = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        connectingRef.current = { source: nodeId, currentX: x, currentY: y };
    };

    const endConnect = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if (connectingRef.current && connectingRef.current.source !== targetId) {
            const newEdge: Edge = {
                id: uuid(),
                source: connectingRef.current.source,
                target: targetId
            };
            setEdges(p => [...p, newEdge]);
        }
        connectingRef.current = null;
    };

    // --- AI Features ---
    const handleAIAction = async (nodeId: string, action: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Visual feedback
        const originalTitle = node.title;
        updateNode(nodeId, { title: 'Thinking...' });

        try {
            if (action === 'enhance') {
                const improved = await generateText(`Improve and expand this note academically:\n${node.data.label}`, "You are an expert tutor.");
                updateNode(nodeId, { data: { ...node.data, label: improved }, title: originalTitle });
            } else if (action === 'flashcards') {
                const cards = await generateFlashcards(node.data.label);
                // Create nodes for cards
                const newNodes: Node[] = cards.map((c, i) => ({
                    id: uuid(),
                    type: 'flashcard',
                    title: 'Auto Card',
                    x: node.x + node.width + 50,
                    y: node.y + (i * 240),
                    width: 300,
                    height: 220,
                    completed: false,
                    data: { label: '', front: c.front, back: c.back, attachments: [] }
                }));
                const newEdges: Edge[] = newNodes.map(n => ({ id: uuid(), source: nodeId, target: n.id }));
                setNodes(p => [...p, ...newNodes]);
                setEdges(p => [...p, ...newEdges]);
                updateNode(nodeId, { title: originalTitle });
            } else if (action === 'quiz') {
                 const quizData = await generateQuiz(node.data.label);
                 if(quizData.length > 0) {
                     const q = quizData[0];
                     const qNode: Node = {
                        id: uuid(),
                        type: 'quiz',
                        title: 'Quiz',
                        x: node.x,
                        y: node.y + node.height + 50,
                        width: 300, 
                        height: 250,
                        completed: false,
                        data: { 
                            label: q.question, 
                            quizOptions: q.options, 
                            correctAnswer: q.answer, 
                            attachments: [] 
                        }
                     };
                     setNodes(p => [...p, qNode]);
                     setEdges(p => [...p, { id: uuid(), source: nodeId, target: qNode.id }]);
                 }
                 updateNode(nodeId, { title: originalTitle });
            }
        } catch (e) {
            alert("AI Error: " + e.message);
            updateNode(nodeId, { title: originalTitle });
        }
    };

    // --- Chat Logic ---
    const sendChatMessage = async () => {
        if(!chatInput.trim()) return;
        const text = chatInput;
        setChatInput('');
        setChatMessages(p => [...p, { id: uuid(), role: 'user', text, timestamp: Date.now() }]);
        setIsChatLoading(true);

        try {
            // Context injection
            let context = "User is in a study canvas.";
            if (selection) {
                const n = nodes.find(n => n.id === selection);
                if (n) context += ` user selected note titled "${n.title}" with content: ${n.data.label}`;
            }

            const response = await generateText(text, `You are a helpful study assistant. Context: ${context}`);
            setChatMessages(p => [...p, { id: uuid(), role: 'model', text: response, timestamp: Date.now() }]);
        } catch (e) {
            setChatMessages(p => [...p, { id: uuid(), role: 'model', text: "Error connecting to Gemini.", timestamp: Date.now() }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="w-full h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
            
            {/* Background */}
            <div 
                ref={canvasRef}
                className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing dot-grid"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                style={{
                    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
                    backgroundSize: `${GRID_SIZE * viewport.zoom}px ${GRID_SIZE * viewport.zoom}px`
                }}
            >
                <div 
                    className="origin-top-left absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
                >
                    {/* Wires */}
                    <svg className="overflow-visible absolute top-0 left-0 w-1 h-1 z-0">
                        {edges.map(edge => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;
                            
                            const startX = source.x + source.width;
                            const startY = source.y + 40; // Approx pin location
                            const endX = target.x;
                            const endY = target.y + 40;
                            
                            // Bezier Curve
                            const dist = Math.abs(endX - startX);
                            const cp1x = startX + dist * 0.5;
                            const cp1y = startY;
                            const cp2x = endX - dist * 0.5;
                            const cp2y = endY;

                            return (
                                <path 
                                    key={edge.id}
                                    d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                                    stroke={COLORS.wire}
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        })}
                        {connectingRef.current && (
                            <line 
                                x1={nodes.find(n => n.id === connectingRef.current!.source)!.x + nodes.find(n => n.id === connectingRef.current!.source)!.width}
                                y1={nodes.find(n => n.id === connectingRef.current!.source)!.y + 40}
                                x2={connectingRef.current.currentX}
                                y2={connectingRef.current.currentY}
                                stroke={COLORS.wireActive}
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        )}
                    </svg>

                    {/* Nodes */}
                    <div className="pointer-events-auto">
                        {nodes.map(node => (
                            <NodeItem 
                                key={node.id}
                                node={node}
                                isSelected={selection === node.id}
                                scale={viewport.zoom}
                                onUpdate={updateNode}
                                onDelete={deleteNode}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onConnectStart={startConnect}
                                onConnectEnd={endConnect}
                                onResizeStart={(e) => { e.stopPropagation(); dragStateRef.current = { type: 'resizeNode', id: node.id, startX: e.clientX, startY: e.clientY }; }}
                                onAttach={() => { activeUploadNodeId.current = node.id; fileInputRef.current?.click(); }}
                                onAIAction={handleAIAction}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* UI Overlay */}
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full h-14 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Layout className="text-white w-5 h-5" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight">FlowDo</h1>
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400 border border-zinc-700">Beta</span>
                </div>

                <div className="flex items-center gap-4">
                     {/* Timer */}
                     <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${timerState.active ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-zinc-900 border-zinc-700'}`}>
                        <Timer size={14} className={timerState.active ? 'text-indigo-400' : 'text-zinc-500'} />
                        <span className="font-mono text-sm w-12 text-center">{Math.floor(timerState.time / 60).toString().padStart(2, '0')}:{(timerState.time % 60).toString().padStart(2, '0')}</span>
                        <button onClick={() => setTimerState(p => ({...p, active: !p.active}))} className="hover:text-white text-zinc-400">
                             {timerState.active ? <span className="text-xs font-bold">||</span> : <Play size={10} fill="currentColor"/>}
                        </button>
                     </div>

                     <div className="h-6 w-px bg-zinc-800"></div>

                     <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}>
                        <Bot size={20} />
                     </button>
                     <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
                        <Settings size={20} />
                     </button>
                </div>
            </div>

            {/* Floating Dock (Tools) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1 z-50">
                <button onClick={() => setContextMenu({ x: window.innerWidth/2, y: window.innerHeight/2, canvasX: (window.innerWidth/2 - viewport.x)/viewport.zoom, canvasY: (window.innerHeight/2 - viewport.y)/viewport.zoom })} className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white tooltip-trigger" title="Add Node">
                    <Plus size={20} />
                </button>
                <div className="w-px h-8 bg-zinc-800 mx-1"></div>
                <button onClick={() => {}} className="p-2.5 rounded-xl bg-zinc-800 text-white shadow-inner">
                    <MousePointer2 size={20} />
                </button>
                <button onClick={() => setNodes(p => p.map(n => ({...n, completed: false})))} className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white">
                    <Eraser size={20} />
                </button>
                 <button onClick={() => setViewport({x:0, y:0, zoom:1})} className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white">
                    <Grid size={20} />
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed bg-zinc-900 border border-zinc-700 p-1.5 rounded-xl shadow-2xl flex flex-col gap-1 w-48 z-[60] animate-in fade-in zoom-in-95 duration-100 origin-top-left"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <span className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Create</span>
                    <button onClick={() => addNode('lecture', contextMenu.canvasX, contextMenu.canvasY)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div> Lecture Note
                    </button>
                    <button onClick={() => addNode('concept', contextMenu.canvasX, contextMenu.canvasY)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300">
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Concept
                    </button>
                    <button onClick={() => addNode('flashcard', contextMenu.canvasX, contextMenu.canvasY)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Flashcard
                    </button>
                    <button onClick={() => addNode('task', contextMenu.canvasX, contextMenu.canvasY)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 rounded-lg text-sm text-zinc-300">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> Task
                    </button>
                </div>
            )}

            {/* Chat Sidebar */}
            {isChatOpen && (
                <div className="fixed right-4 bottom-20 w-96 h-[600px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right-10 duration-200">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-indigo-500" size={16}/>
                            <span className="font-semibold text-sm">Gemini Companion</span>
                        </div>
                        <button onClick={() => setIsChatOpen(false)}><X size={16} className="text-zinc-500 hover:text-white"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && <div className="text-xs text-zinc-500 italic animate-pulse">Gemini is thinking...</div>}
                    </div>
                    <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                placeholder="Ask about your notes..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                            />
                            <button onClick={sendChatMessage} className="bg-indigo-600 p-2 rounded-xl text-white hover:bg-indigo-500">
                                <Share2 className="rotate-90" size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl transform scale-100 transition-all">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="text-indigo-500"/> Settings</h2>
                        
                        <div className="mb-6">
                            <p className="text-zinc-400 text-sm">Application settings are configured via environment variables.</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
            
            <input type="file" ref={fileInputRef} className="hidden" />
        </div>
    );
}