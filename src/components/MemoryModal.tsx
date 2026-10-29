import React, { useState, useEffect } from 'react';
import { Brain, X, Plus, Trash2, Check, Sparkles, User, Heart } from 'lucide-react';
import {
  loadUserMemory,
  saveUserMemory,
  addMemoryFact,
  addCustomNote,
  removeMemoryFact,
  removeCustomNote,
  UserMemory,
} from '../services/memoryService';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const [memory, setMemory] = useState<UserMemory>(loadUserMemory());
  const [nameInput, setNameInput] = useState('');
  const [newFactInput, setNewFactInput] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = loadUserMemory();
      setMemory(current);
      setNameInput(current.userName);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const updated = saveUserMemory({ userName: nameInput.trim() });
      setMemory(updated);
      showNotice();
    }
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFactInput.trim()) {
      const updated = addMemoryFact(newFactInput.trim());
      setMemory(updated);
      setNewFactInput('');
      showNotice();
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteInput.trim()) {
      const updated = addCustomNote(newNoteInput.trim());
      setMemory(updated);
      setNewNoteInput('');
      showNotice();
    }
  };

  const handleRemoveFact = (index: number) => {
    const updated = removeMemoryFact(index);
    setMemory(updated);
    showNotice();
  };

  const handleRemoveNote = (index: number) => {
    const updated = removeCustomNote(index);
    setMemory(updated);
    showNotice();
  };

  const showNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">Testimony&apos;s Memory</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-semibold border border-purple-800">
                  Human-like Bond
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Context and memories Testimony retains to converse like a real partner.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {savedNotice && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Memory updated and saved permanently!</span>
            </div>
          )}

          {/* User Name Preference */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-purple-300 font-semibold mb-2 text-xs">
              <User className="w-3.5 h-3.5" />
              <span>What should Testimony call you?</span>
            </div>
            <form onSubmit={handleUpdateName} className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Testimony, Bassey, or your nickname"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                Save
              </button>
            </form>
          </div>

          {/* Remembered Facts */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Things Testimony Remembers About You</span>
              </div>
              <span className="text-[10px] text-slate-400">{memory.keyFacts.length} items</span>
            </div>

            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto pr-1">
              {memory.keyFacts.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs text-slate-200 group"
                >
                  <span className="pr-2 leading-relaxed">{fact}</span>
                  <button
                    onClick={() => handleRemoveFact(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
                    title="Remove fact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddFact} className="flex gap-2">
              <input
                type="text"
                value={newFactInput}
                onChange={(e) => setNewFactInput(e.target.value)}
                placeholder="Add a new fact (e.g. 'I am preparing for an exam in biology')"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!newFactInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Personal Preferences */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs mb-2">
              <Heart className="w-3.5 h-3.5" />
              <span>Voice &amp; Conversational Preferences</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300">
              {memory.preferences.map((pref, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>{pref}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Custom Notes */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-300 font-semibold text-xs">Personal Notes for Testimony</span>
            </div>
            <div className="space-y-1.5 mb-2.5 max-h-32 overflow-y-auto pr-1">
              {memory.customNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs text-slate-200"
                >
                  <span className="pr-2 leading-relaxed">{note}</span>
                  <button
                    onClick={() => handleRemoveNote(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                placeholder="Add a custom note (e.g. 'I enjoy friendly intellectual debate')"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!newNoteInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Memories are stored securely with your account.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
