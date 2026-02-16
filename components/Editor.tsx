import React, { useState, useEffect, useRef } from 'react';
import { Note, AIServiceTask, AIState } from '../types';
import { processNoteWithAI } from '../services/geminiService';
import { Button } from './Button';
import { 
  Wand2, 
  Save, 
  Sparkles, 
  Type, 
  Hash, 
  AlignLeft,
  PenLine,
  X,
  Plus
} from 'lucide-react';

interface EditorProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onCreate: () => void;
}

export const Editor: React.FC<EditorProps> = ({ note, onUpdate, onCreate }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [aiState, setAiState] = useState<AIState>({
    isGenerating: false,
    error: null,
    suggestion: null,
    type: null
  });
  const [showAiMenu, setShowAiMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAiState({ isGenerating: false, error: null, suggestion: null, type: null });
  }, [note.id]);

  // Debounce save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onUpdate({
          ...note,
          title,
          content,
          updatedAt: Date.now()
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAIAction = async (task: AIServiceTask) => {
    if (!content.trim() && task !== AIServiceTask.CONTINUE) {
        setAiState(prev => ({ ...prev, error: "Content is empty" }));
        return;
    }

    setAiState({ isGenerating: true, error: null, suggestion: null, type: null });
    setShowAiMenu(false);

    try {
      if (task === AIServiceTask.GENERATE_TAGS) {
        const tags = await processNoteWithAI(task, content) as string[];
        onUpdate({
            ...note,
            tags: [...new Set([...note.tags, ...tags])], // Unique tags
            title,
            content,
            updatedAt: Date.now()
        });
        setAiState({ isGenerating: false, error: null, suggestion: null, type: null });
      } else if (task === AIServiceTask.GENERATE_TITLE) {
          const newTitle = await processNoteWithAI(task, content) as string;
          setTitle(newTitle); // Immediate update for title
          setAiState({ isGenerating: false, error: null, suggestion: null, type: null });
      } else {
        const result = await processNoteWithAI(task, content, title) as string;
        
        let resultType: AIState['type'] = 'summary';
        if (task === AIServiceTask.CONTINUE) resultType = 'continuation';
        if (task === AIServiceTask.FIX_GRAMMAR) resultType = 'fix';

        setAiState({
          isGenerating: false,
          error: null,
          suggestion: result,
          type: resultType
        });
      }
    } catch (err) {
      setAiState({
        isGenerating: false,
        error: "Failed to generate AI response. Please try again.",
        suggestion: null,
        type: null
      });
    }
  };

  const applySuggestion = () => {
    if (!aiState.suggestion) return;

    if (aiState.type === 'continuation') {
      setContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + aiState.suggestion);
    } else if (aiState.type === 'fix') {
      setContent(aiState.suggestion);
    } else if (aiState.type === 'summary') {
      // Append summary to the bottom
      setContent(prev => prev + '\n\n**Summary:**\n' + aiState.suggestion);
    }

    setAiState(prev => ({ ...prev, suggestion: null, type: null }));
  };

  const discardSuggestion = () => {
    setAiState(prev => ({ ...prev, suggestion: null, type: null }));
  };

  const removeTag = (tagToRemove: string) => {
      onUpdate({
          ...note,
          title,
          content,
          tags: note.tags.filter(t => t !== tagToRemove),
          updatedAt: Date.now()
      });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between pl-16 pr-4 py-4 md:px-6 border-b border-slate-100 bg-white z-10">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="w-full text-2xl font-bold text-slate-900 placeholder-slate-300 border-none focus:ring-0 p-0 bg-transparent"
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
             {note.tags.map(tag => (
                 <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                     #{tag}
                     <button onClick={() => removeTag(tag)} className="ml-1 text-indigo-400 hover:text-indigo-900">
                         <X size={10} />
                     </button>
                 </span>
             ))}
             {note.tags.length === 0 && <span className="text-xs text-slate-400 italic">No tags</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <span className="text-xs text-slate-400 mr-2 hidden sm:inline">
              {aiState.isGenerating ? 'AI Thinking...' : 'Saved'}
          </span>

          <Button 
            variant="primary"
            onClick={onCreate}
            className="mr-2"
            title="Create new note"
          >
             <Plus size={16} className="sm:mr-2" />
             <span className="hidden sm:inline">New Note</span>
          </Button>

          <Button 
            variant="secondary"
            onClick={() => setShowAiMenu(!showAiMenu)}
            isLoading={aiState.isGenerating}
            icon={<Sparkles size={16} className="text-indigo-600" />}
          >
            <span className="hidden sm:inline">AI Tools</span>
            <span className="sm:hidden">AI</span>
          </Button>

          {showAiMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-20">
              <div className="p-1">
                <button onClick={() => handleAIAction(AIServiceTask.FIX_GRAMMAR)} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md">
                   <Wand2 size={14} className="mr-2 text-blue-500" /> Fix Grammar
                </button>
                <button onClick={() => handleAIAction(AIServiceTask.CONTINUE)} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md">
                   <PenLine size={14} className="mr-2 text-green-500" /> Continue Writing
                </button>
                <button onClick={() => handleAIAction(AIServiceTask.SUMMARIZE)} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md">
                   <AlignLeft size={14} className="mr-2 text-purple-500" /> Summarize
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button onClick={() => handleAIAction(AIServiceTask.GENERATE_TITLE)} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md">
                   <Type size={14} className="mr-2 text-orange-500" /> Generate Title
                </button>
                <button onClick={() => handleAIAction(AIServiceTask.GENERATE_TAGS)} className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md">
                   <Hash size={14} className="mr-2 text-pink-500" /> Auto-Tag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
        <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing..."
            className="flex-1 w-full p-8 resize-none focus:outline-none bg-white text-slate-900 leading-relaxed text-lg placeholder:text-slate-400"
        />

        {/* Suggestion Review Panel */}
        {aiState.suggestion && (
            <div className="absolute bottom-6 left-6 right-6 bg-white border border-indigo-100 shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 z-10">
                <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between border-b border-indigo-100">
                    <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                        <Sparkles size={14} /> 
                        {aiState.type === 'fix' ? 'Grammar Fix' : aiState.type === 'continuation' ? 'Continuation' : 'Summary'} Suggestion
                    </h4>
                </div>
                <div className="p-4 max-h-40 overflow-y-auto bg-slate-50">
                    <p className="text-slate-800 text-sm whitespace-pre-wrap">{aiState.suggestion}</p>
                </div>
                <div className="p-3 bg-white flex justify-end gap-2 border-t border-slate-100">
                    <Button variant="ghost" onClick={discardSuggestion} className="text-sm">Discard</Button>
                    <Button variant="primary" onClick={applySuggestion} className="text-sm">
                        {aiState.type === 'fix' ? 'Replace Content' : 'Append'}
                    </Button>
                </div>
            </div>
        )}

        {/* Error Toast */}
        {aiState.error && (
            <div className="absolute bottom-6 right-6 bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-lg border border-red-100 text-sm flex items-center">
                <span className="mr-2">⚠️</span> {aiState.error}
                <button onClick={() => setAiState(prev => ({...prev, error: null}))} className="ml-4 hover:text-red-800"><X size={14} /></button>
            </div>
        )}
      </div>
    </div>
  );
};