import React from 'react';
import { Note } from '../types';
import { Plus, Search, Trash2, FileText } from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  searchQuery,
  onSearchChange,
  className = ''
}) => {
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 border-r border-slate-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={18} />
            </span>
            Cybernotes
          </h1>
          <button
            onClick={onCreateNote}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
            aria-label="Create new note"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-4 text-center">
            <FileText size={48} className="mb-2 opacity-20" />
            <p className="text-sm">No notes found</p>
            {notes.length === 0 && <p className="text-xs mt-1">Click + to create one</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-4 cursor-pointer transition-colors hover:bg-white ${
                  activeNoteId === note.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : 'border-l-4 border-transparent'
                }`}
              >
                <h3 className={`font-semibold text-sm mb-1 truncate pr-8 ${
                  activeNoteId === note.id ? 'text-indigo-900' : 'text-slate-700'
                }`}>
                  {note.title || 'Untitled Note'}
                </h3>
                <p className="text-xs text-slate-500 truncate mb-2">
                  {note.content || 'No content...'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                     {note.tags.slice(0, 2).map(tag => (
                       <span key={tag} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded-md truncate max-w-[60px]">
                         #{tag}
                       </span>
                     ))}
                     {note.tags.length > 2 && <span className="text-[10px] text-slate-400">+{note.tags.length - 2}</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>

                <button
                  onClick={(e) => onDeleteNote(note.id, e)}
                  className="absolute top-4 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};