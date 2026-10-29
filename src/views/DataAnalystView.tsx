import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart3,
  Upload,
  FileSpreadsheet,
  Table,
  Sparkles,
  TrendingUp,
  Search,
  Download,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { callGeminiGenerate } from '../services/geminiService';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface DataAnalystViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const DataAnalystView: React.FC<DataAnalystViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [data, setData] = useState<Array<Record<string, any>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNumColumn, setSelectedNumColumn] = useState<string | null>(null);
  const [selectedCatColumn, setSelectedCatColumn] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Sample CSV generator for users who want to try instantly
  const loadSampleData = () => {
    const sampleCsv = `Month,Category,Sales,Expenses,UnitsSold
Jan,Electronics,12500,8200,45
Jan,Apparel,6400,3100,120
Feb,Electronics,14200,8900,52
Feb,Apparel,7100,3400,135
Mar,Electronics,18900,9500,68
Mar,Apparel,8300,3900,160
Apr,Electronics,16400,9100,59
Apr,Apparel,9200,4200,175
May,Electronics,21500,10200,81
May,Apparel,11200,4800,210`;

    parseRawCsv(sampleCsv, 'Sample_Global_Sales_2026.csv');
  };

  const parseRawCsv = (csvText: string, name: string) => {
    setParseError(null);
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing issues:', results.errors);
        }
        if (results.data && results.data.length > 0) {
          const rows = results.data as Array<Record<string, any>>;
          const cols = Object.keys(rows[0] || {});
          setData(rows);
          setColumns(cols);
          setFileName(name);
          setCurrentPage(1);

          // Auto-select first numeric column
          const firstNum = cols.find((c) => typeof rows[0][c] === 'number');
          if (firstNum) setSelectedNumColumn(firstNum);

          const firstCat = cols.find((c) => typeof rows[0][c] === 'string');
          if (firstCat) setSelectedCatColumn(firstCat);
        } else {
          setParseError('The file contains no readable data rows.');
        }
      },
      error: (err: any) => {
        setParseError('Failed to parse CSV: ' + err.message);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseRawCsv(text, file.name);
    };
    reader.readAsText(file);
  };

  // Real Mathematical Calculations
  const numericColumns = useMemo(() => {
    if (data.length === 0) return [];
    return columns.filter((col) => data.some((row) => typeof row[col] === 'number'));
  }, [data, columns]);

  const categoricalColumns = useMemo(() => {
    if (data.length === 0) return [];
    return columns.filter((col) => !numericColumns.includes(col));
  }, [data, columns, numericColumns]);

  const columnStats = useMemo(() => {
    if (!selectedNumColumn || data.length === 0) return null;

    const values = data
      .map((r) => r[selectedNumColumn])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return null;

    const total = values.reduce((acc, curr) => acc + curr, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    return { total, average, min, max, median, count: values.length };
  }, [data, selectedNumColumn]);

  // Filtered rows for table
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col] ?? '').toLowerCase().includes(lower))
    );
  }, [data, columns, searchTerm]);

  // AI Deep Analysis
  const handleRunAiAnalysis = async (customPrompt?: string) => {
    if (data.length === 0 || isAiLoading) return;

    setIsAiLoading(true);
    setAiAnalysis(null);

    const dataPreview = data.slice(0, 30);
    const summaryStats = numericColumns.map((col) => {
      const vals = data.map((r) => r[col]).filter((v) => typeof v === 'number');
      const sum = vals.reduce((a, b) => a + b, 0);
      return `${col}: Total=${sum}, Avg=${(sum / vals.length).toFixed(2)}, Min=${Math.min(...vals)}, Max=${Math.max(...vals)}`;
    });

    const prompt = customPrompt || `Analyze the provided dataset "${fileName || 'Data Table'}".
Dataset has ${data.length} total rows and columns: [${columns.join(', ')}].
Exact Verified Column Stats:
${summaryStats.join('\n')}

Data Sample (First 30 rows):
${JSON.stringify(dataPreview, null, 2)}

Provide:
1. Executive Summary in plain English.
2. Key Trends & Statistical Highlights (based strictly on verified data).
3. Anomalies, Outliers or Unusual Patterns.
4. Practical Business / Decision-Making Recommendations.`;

    try {
      const analysis = await callGeminiGenerate({
        prompt,
        systemInstruction: 'You are Testimony AI Data Intelligence Scientist. Calculate and reason with rigorous precision. Never fabricate values or patterns that do not exist.',
        temperature: 0.2,
      });

      setAiAnalysis(analysis);
    } catch (err: any) {
      setParseError('AI Analysis error: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const pageSize = 8;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Statistical Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            AI Data Analyst &amp; Visualizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload CSV datasets for genuine calculations, trends, interactive charts, and plain-English summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={loadSampleData}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            Load Sample Data
          </button>
        </div>
      </div>

      {parseError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* When No Data Loaded */}
      {data.length === 0 ? (
        <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-3xl p-10 text-center space-y-4 bg-slate-900/40 transition">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Dataset Uploaded Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Upload your sales, educational, finance, or customer CSV file, or try our sample dataset to see real-time charts and statistical breakdowns.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Select CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={loadSampleData}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Try Demo Data
            </button>
          </div>
        </div>
      ) : (
        /* Data Loaded View */
        <div className="space-y-6">
          {/* File summary & stats pill */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">{fileName}</span>
                <span className="text-xs text-slate-400">
                  {data.length} rows • {columns.length} columns • {numericColumns.length} numerical fields
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={isAiLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Dataset...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI Report</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          {columnStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Total / Sum</span>
                <div className="text-lg font-black text-white mt-0.5">
                  {columnStats.total.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <span className="text-[10px] text-purple-400 font-medium">{selectedNumColumn}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Average / Mean</span>
                <div className="text-lg font-black text-cyan-300 mt-0.5">
                  {columnStats.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <span className="text-[10px] text-slate-400">{columnStats.count} data points</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Median</span>
                <div className="text-lg font-black text-indigo-300 mt-0.5">
                  {columnStats.median.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
                <span className="text-[10px] text-slate-400">50th percentile</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Min Value</span>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {columnStats.min.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Lowest</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Max Value</span>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  {columnStats.max.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">Highest</span>
              </div>
            </div>
          )}

          {/* Interactive Visual Chart (SVG Bar Chart) */}
          {selectedNumColumn && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-sm">Visual Distribution: {selectedNumColumn}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Metric Column:</span>
                  <select
                    value={selectedNumColumn}
                    onChange={(e) => setSelectedNumColumn(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                  >
                    {numericColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic SVG Bar Chart */}
              <div className="h-56 w-full pt-4 flex items-end gap-1.5 sm:gap-2 px-2 overflow-x-auto">
                {data.slice(0, 24).map((row, idx) => {
                  const val = Number(row[selectedNumColumn]) || 0;
                  const max = columnStats?.max || 1;
                  const heightPercent = Math.max(6, Math.min(100, Math.round((val / max) * 100)));
                  const label = selectedCatColumn ? String(row[selectedCatColumn]) : `Row ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center gap-1 group relative"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-slate-800 text-[10px] font-mono text-purple-200 px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                        {label}: {val.toLocaleString()}
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 via-purple-600 to-cyan-400 group-hover:brightness-125 transition-all shadow-md"
                      />

                      {/* X label */}
                      <span className="text-[9px] text-slate-500 truncate w-full text-center">
                        {label.slice(0, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Data Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white text-xs sm:text-sm">Data Explorer</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search rows..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="px-3.5 py-2.5 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {paginatedData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 text-slate-200">
                      {columns.map((col) => (
                        <td key={col} className="px-3.5 py-2 text-slate-300">
                          {typeof row[col] === 'number'
                            ? Number(row[col]).toLocaleString()
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  Prev
                </button>
                <span className="font-mono text-purple-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights and Dataset Q&A */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Ask Questions About Your Data</h3>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="e.g., Which category grew the fastest? What is the correlation between expenses and sales?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunAiAnalysis(customQuestion);
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => handleRunAiAnalysis(customQuestion)}
                disabled={!customQuestion.trim() || isAiLoading}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition"
              >
                Analyze
              </button>
            </div>

            {aiAnalysis && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-slate-200">
                <MarkdownRenderer content={aiAnalysis} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
