import React, { useState } from 'react';
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  Trash2,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';

interface TranslatorViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const TranslatorView: React.FC<TranslatorViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('French');
  const [tone, setTone] = useState<'formal' | 'casual' | 'academic' | 'professional'>('professional');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedLanguages = [
    'English',
    'French',
    'Spanish',
    'Portuguese',
    'Arabic',
    'German',
    'Chinese (Mandarin)',
    'Hindi',
    'Yoruba',
    'Swahili',
    'Japanese',
    'Italian',
    'Russian',
    'Korean',
    'Dutch',
    'Hausa',
    'Igbo',
    'Turkish',
    'Vietnamese',
  ];

  const handleTranslate = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const prompt = `Translate the following text to ${targetLang}.
Source language setting: ${sourceLang === 'auto' ? 'Auto-detect source language' : sourceLang}.
Translation style/tone: ${tone} (Formal = polite & respectful; Casual = friendly daily speech; Academic = scholarly, precise terminology; Professional = executive, business context).
Preserve idioms and cultural accuracy.

Return a JSON with the format:
{
  "detectedSourceLanguage": "name of detected language",
  "translatedText": "translated content",
  "culturalNotes": "short 1-line note on nuance or idiom if relevant"
}

Text to translate:
"""
${inputText}
"""`;

    try {
      const result = await callGeminiGenerate({
        prompt,
        systemInstruction: 'You are Testimony AI Multilingual Translation Engine. Always respond in valid JSON.',
        temperature: 0.3,
      });

      // Parse JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setOutputText(parsed.translatedText || result);
        if (parsed.detectedSourceLanguage) {
          setDetectedLang(parsed.detectedSourceLanguage);
        }
      } else {
        setOutputText(result.trim());
      }
    } catch (err: any) {
      setError(err?.message || 'Translation failed. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang);
      setTargetLang('English');
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
    const prevInput = inputText;
    setInputText(outputText);
    setOutputText(prevInput);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
          <Languages className="w-4 h-4" />
          <span>Global Polyglot Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          AI Multilingual Translator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Accurate translations preserving tone, nuance, and idioms across English, French, Spanish, Yoruba, Arabic, and more.
        </p>
      </div>

      {/* Language Bar Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Source Lang */}
          <div className="w-full sm:w-5/12">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Source Language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="auto">Auto Detect Language {detectedLang ? `(${detectedLang})` : ''}</option>
              {supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0 mt-3 sm:mt-0"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Target Lang */}
          <div className="w-full sm:w-5/12">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Style / Tone:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-xs">
              {(['professional', 'formal', 'casual', 'academic'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                    tone === t ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nuance &amp; Idiom Preservation</span>
          </div>
        </div>
      </div>

      {/* Dual Translation Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[260px]">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <span>Enter Text</span>
              <span>{inputText.length} characters</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type, paste, or dictate text to translate..."
              rows={8}
              className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setInputText('');
                setOutputText('');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Pane */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl min-h-[260px] relative">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800 mb-2">
              <span className="text-purple-300 font-semibold">{targetLang} Translation</span>
              {detectedLang && <span className="text-[10px] text-slate-500">From: {detectedLang}</span>}
            </div>

            <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap min-h-[160px]">
              {outputText ? (
                outputText
              ) : (
                <span className="text-slate-600 italic">
                  Translation will appear here with professional vocabulary and grammar.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => handleSpeak(outputText)}
              disabled={!outputText}
              className="p-1.5 text-slate-400 hover:text-white transition text-xs flex items-center gap-1 disabled:opacity-30"
              title="Listen pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pronounce</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!outputText}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-30"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Translation</span>
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
    </div>
  );
};
