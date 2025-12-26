import React from 'react';
import { Settings, BookOpen, Wand2, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  apiKey,
  onApiKeyChange,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Settings
        </h2>
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">Google Gemini API Key</label>
          <input 
            type="password" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500" 
            placeholder="Demo Mode if empty" 
            value={apiKey} 
            onChange={(e) => onApiKeyChange(e.target.value)} 
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 text-sm hover:bg-zinc-800 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={onSave} 
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

interface TopicModalProps {
  isOpen: boolean;
  topicInput: string;
  onTopicInputChange: (value: string) => void;
  onGenerate: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  topicInput,
  onTopicInputChange,
  onGenerate,
  onClose,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-96 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
          <BookOpen className="w-5 h-5" /> Create Study Plan
        </h2>
        <textarea 
          className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 text-sm focus:outline-none focus:border-purple-500 min-h-[80px]" 
          placeholder="Topic..." 
          value={topicInput} 
          onChange={(e) => onTopicInputChange(e.target.value)} 
        />
        <div className="flex justify-end gap-2 mt-4">
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 text-sm hover:bg-zinc-800 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={onGenerate} 
            disabled={!topicInput.trim()} 
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded font-medium flex items-center gap-2"
          >
            {isLoading ? 'Generating...' : 'Generate'} <Wand2 size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-indigo-900/80 backdrop-blur text-indigo-100 px-4 py-2 rounded-full text-sm font-medium z-[100] animate-pulse shadow-lg flex items-center gap-2">
      <Sparkles size={16} /> AI Thinking...
    </div>
  );
};