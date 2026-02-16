import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Note } from './types';
import { Menu } from 'lucide-react';

const STORAGE_KEY = 'cybernotes_app_data_v1';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) {
            setActiveNoteId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load notes", e);
      }
    } else {
        // Create a welcome note if empty
        const welcomeNote: Note = {
            id: crypto.randomUUID(),
            title: 'Welcome to Cybernotes',
            content: "Welcome! This is a simple, AI-powered note taking app.\n\nTry the 'AI Tools' button in the top right to:\n- Fix grammar\n- Continue your writing\n- Summarize long notes\n- Auto-generate tags\n\nEnjoy writing!",
            tags: ['welcome', 'guide'],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setNotes([welcomeNote]);
        setActiveNoteId(welcomeNote.id);
    }
  }, []);

  // Save notes on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    // On mobile, close sidebar after creating to focus on editor
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prevNotes => 
      prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
        const newNotes = notes.filter(n => n.id !== id);
        setNotes(newNotes);
        if (activeNoteId === id) {
            setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
        }
    }
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white rounded-md shadow-md text-slate-600"
          >
              <Menu size={20} />
          </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => {
              setActiveNoteId(id);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full w-full bg-white md:rounded-l-2xl shadow-sm overflow-hidden border-l border-slate-100">
        {activeNote ? (
          <Editor 
            note={activeNote} 
            onUpdate={handleUpdateNote} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
             <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-200">
                 <Menu size={32} />
             </div>
             <p className="text-lg font-medium text-slate-500">Select a note to view</p>
             <button 
                onClick={handleCreateNote}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
             >
                 Create a new note
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;