import React from 'react';
import {
  MessageSquare,
  GraduationCap,
  FileText,
  Languages,
  BarChart3,
  PenTool,
  Calculator,
  FileSearch,
  Briefcase,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
  Shield,
  Globe,
  ArrowRight,
  Radio,
  KeyRound,
  Search,
} from 'lucide-react';
import { ActiveTool, Conversation } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onGoToWebsite?: () => void;
  onOpenFreeAccessModal?: () => void;
  isOwner?: boolean;
  onExitFreePlan?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  setActiveTool,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onCloseMobile,
  onGoToWebsite,
  onOpenFreeAccessModal,
  isOwner = false,
  onExitFreePlan,
}) => {
  const primaryTools: Array<{ id: ActiveTool; name: string; icon: React.ElementType; badge?: string; desc: string }> = [
    { id: 'chat', name: 'AI Chat Assistant', icon: MessageSquare, desc: 'Conversations & brainstorming' },
    { id: 'live_chat', name: 'Live Chat', icon: Radio, badge: 'Voice (M/F)', desc: 'Real-time spoken discussion' },
    { id: 'job_scanner', name: 'Jobs & Client Lead Radar', icon: Search, badge: 'NG & Global', desc: 'Failing webs & remote jobs' },
    { id: 'assignment', name: 'Assignment Solver', icon: GraduationCap, badge: 'Study', desc: 'School & exams' },
    { id: 'cv_builder', name: 'CV & Resume Builder', icon: FileText, badge: 'Career', desc: 'ATS resume & PDF' },
    { id: 'translator', name: 'Multilingual Translator', icon: Languages, badge: 'Global', desc: 'Yoruba, French, Spanish...' },
    { id: 'data_analyst', name: 'AI Data Analyst', icon: BarChart3, badge: 'CSV', desc: 'Data tables & charts' },
    { id: 'writing', name: 'Writing Assistant', icon: PenTool, desc: 'Emails, essays & reports' },
    { id: 'math', name: 'AI Math Solver', icon: Calculator, desc: 'Step-by-step solutions' },
    { id: 'document', name: 'Document Assistant', icon: FileSearch, desc: 'Doc summary & Q&A' },
    { id: 'business', name: 'Business Assistant', icon: Briefcase, desc: 'Plans, pitches & marketing' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding with Hidden 100% Free Plan trigger under T logo */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Logo
            size="sm"
            showTagline={false}
            onSecretLogoClick={onOpenFreeAccessModal}
            isOwnerFreeActive={isOwner}
            onExitFreePlan={onExitFreePlan}
          />
          <button
            onClick={onNewChat}
            className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Website shortcut */}
        {onGoToWebsite && (
          <div className="px-3 pt-3">
            <button
              onClick={() => {
                onGoToWebsite();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/40 text-purple-300 hover:text-white hover:border-purple-600/50 transition group"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Product Website</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        )}

        {/* Tools Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main AI Tools */}
          <div>
            <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI Tools &amp; Solutions
            </div>
            <nav className="space-y-1">
              {primaryTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id);
                      onCloseMobile();
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/25 to-indigo-600/25 text-white border border-purple-500/40 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-purple-300 group-hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="truncate">
                        <div className="truncate font-semibold">{tool.name}</div>
                        <div className="text-[10px] text-slate-400 truncate font-normal">{tool.desc}</div>
                      </div>
                    </div>
                    {tool.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 shrink-0">
                        {tool.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Recent Conversations */}
          {conversations.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Recent Chats</span>
                <span className="text-[10px] text-slate-400 font-normal">{conversations.length}</span>
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {conversations.slice(0, 10).map((conv) => {
                  const isCurrent = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        isCurrent
                          ? 'bg-slate-800 text-purple-300 font-medium'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conv.id);
                          setActiveTool(conv.tool || 'chat');
                          onCloseMobile();
                        }}
                        className="truncate flex-1 text-left flex items-center gap-1.5 min-w-0"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{conv.title || 'Untitled Chat'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition ml-1"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings link */}
          <div className="pt-2 border-t border-slate-800/60">
            <button
              onClick={() => {
                setActiveTool('settings');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTool === 'settings'
                  ? 'bg-purple-600/25 text-white border border-purple-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings &amp; Preferences</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Engine Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="w-full p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-left">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-purple-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Testimony AI Engine</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              High-speed reasoning • Zero config needed
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
