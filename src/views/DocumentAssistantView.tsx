import React, { useState } from 'react';
import {
  FileSearch,
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  HelpCircle,
  Check,
  Copy,
  AlertCircle,
  ListCollapse,
} from 'lucide-react';
import { callGeminiAnalyzeDoc } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface DocumentAssistantViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const DocumentAssistantView: React.FC<DocumentAssistantViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [docName, setDocName] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');
  const [task, setTask] = useState<'summary' | 'points' | 'explain' | 'qa' | 'notes'>('summary');
  const [customQuestion, setCustomQuestion] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setDocName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setDocContent(text);
      } else {
        setError('Could not extract text from this file. Ensure it is a text-readable format (.txt, .md, .json, .csv, etc.).');
      }
    };
    reader.onerror = () => {
      setError('File reading error. Please try uploading as .txt or paste text directly.');
    };
    reader.readAsText(file);
  };

  const handleRunTask = async () => {
    if (!docContent.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const taskDescriptions = {
      summary: 'Provide an Executive Summary and high-level briefing of this document.',
      points: 'Extract the top 10 most critical points, key takeaways, and conclusions in bullet form.',
      explain: 'Identify and explain complex jargon, dense passages, or difficult terms in simple, clear language.',
      qa: customQuestion || 'Answer questions and provide insights about this document.',
      notes: 'Format this document into an organized set of structured study notes with flashcard concepts.',
    };

    try {
      const result = await callGeminiAnalyzeDoc(
        docName || 'Uploaded Text',
        docContent,
        taskDescriptions[task]
      );

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to process document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <FileSearch className="w-4 h-4" />
          <span>Document Intelligence</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          AI Document Assistant &amp; Q&amp;A
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Upload or paste any report, lesson notes, or article to extract key points, create study notes, and ask specific questions.
        </p>
      </div>

      {/* Upload & Content Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document (.txt, .md, .csv)</span>
              <input type="file" accept=".txt,.md,.csv,.json,.doc,.log" onChange={handleFileUpload} className="hidden" />
            </label>
            {docName && (
              <span className="text-xs text-purple-300 font-mono bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800">
                {docName}
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500">
            {docContent ? `${docContent.length} characters loaded` : 'Or paste text directly below'}
          </span>
        </div>

        <div>
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            rows={6}
            placeholder="Paste your document content, research paper extract, syllabus, contract clauses, or book chapter here..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Task Selection */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300">Choose Action:</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'summary', name: 'Executive Summary', icon: FileText },
              { id: 'points', name: 'Extract Key Points', icon: ListCollapse },
              { id: 'explain', name: 'Explain Passages', icon: HelpCircle },
              { id: 'notes', name: 'Generate Study Notes', icon: BookOpen },
              { id: 'qa', name: 'Ask a Question', icon: Sparkles },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTask(t.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition flex flex-col items-center gap-1.5 ${
                    task === t.id
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>

          {task === 'qa' && (
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="What specifically do you want to find in this document?"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleRunTask}
              disabled={!docContent.trim() || isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {analysisResult && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Document Analysis Insights</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition flex items-center gap-1.5"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Insights</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-200">
            <MarkdownRenderer content={analysisResult} />
          </div>
        </div>
      )}
    </div>
  );
};
