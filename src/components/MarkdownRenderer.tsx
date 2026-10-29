import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse blocks
  const parseBlocks = (text: string) => {
    const blocks: Array<{ type: 'code' | 'text'; content: string; language?: string }> = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      blocks.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      blocks.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return blocks;
  };

  const renderTextSegment = (txt: string) => {
    const lines = txt.split('\n');
    return lines.map((line, lIdx) => {
      // Heading 1
      if (line.startsWith('# ')) {
        return (
          <h1 key={lIdx} className="text-xl sm:text-2xl font-bold text-white mt-4 mb-2 tracking-tight">
            {formatInline(line.replace('# ', ''))}
          </h1>
        );
      }
      // Heading 2
      if (line.startsWith('## ')) {
        return (
          <h2 key={lIdx} className="text-lg sm:text-xl font-bold text-purple-300 mt-4 mb-2">
            {formatInline(line.replace('## ', ''))}
          </h2>
        );
      }
      // Heading 3
      if (line.startsWith('### ')) {
        return (
          <h3 key={lIdx} className="text-base sm:text-lg font-semibold text-blue-300 mt-3 mb-1">
            {formatInline(line.replace('### ', ''))}
          </h3>
        );
      }
      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <blockquote key={lIdx} className="border-l-4 border-purple-500/60 pl-3 my-2 text-slate-300 italic bg-purple-950/20 py-1 rounded-r">
            {formatInline(line.replace('> ', ''))}
          </blockquote>
        );
      }
      // Unordered list
      if (line.match(/^[\*\-]\s/)) {
        return (
          <li key={lIdx} className="ml-4 list-disc text-slate-200 my-1">
            {formatInline(line.replace(/^[\*\-]\s/, ''))}
          </li>
        );
      }
      // Numbered list
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={lIdx} className="ml-4 list-decimal text-slate-200 my-1">
            {formatInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={lIdx} className="h-2" />;
      }
      // Normal paragraph
      return (
        <p key={lIdx} className="my-1.5 leading-relaxed text-slate-200">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text: string) => {
    // Bold with **
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono border border-slate-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 text-sm sm:text-base leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div key={bIdx} className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900/90 shadow-lg">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-400 font-mono">
                <span className="uppercase font-semibold tracking-wider text-purple-400">
                  {block.language || 'code'}
                </span>
                <button
                  onClick={() => handleCopyCode(block.content, bIdx)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedIndex === bIdx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs sm:text-sm text-slate-200 overflow-x-auto font-mono leading-normal">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }
        return <div key={bIdx}>{renderTextSegment(block.content)}</div>;
      })}
    </div>
  );
};
