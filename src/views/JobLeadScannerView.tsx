import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Briefcase,
  AlertTriangle,
  Send,
  Copy,
  Check,
  Download,
  Filter,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  ShieldAlert,
  Zap,
  Code2,
  X,
  FileSpreadsheet,
  Radio,
  Radar as RadarIcon,
  Crosshair,
  Compass,
  Cpu
} from 'lucide-react';
import { ScannedJobLead, scanOnlineJobsAndLeads } from '../services/geminiService';

interface JobLeadScannerViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const JobLeadScannerView: React.FC<JobLeadScannerViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [leads, setLeads] = useState<ScannedJobLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('Nigeria');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('testimony_saved_leads');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Pitch Modal State
  const [activePitchLead, setActivePitchLead] = useState<ScannedJobLead | null>(null);
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  // Radar Telemetry Logs
  const scanTelemetrySteps = [
    '🛰️ Radar Sweep Activated: Sweeping domains, registries & job boards...',
    '🔍 Diagnosing mobile viewports, page load speeds & checkout friction...',
    '👥 Cross-referencing decision makers, corporate emails & WhatsApp lines...',
    '💡 Synthesizing high-converting cold pitches & calculating budget estimates...',
    '🎯 Radar targets locked and verified!'
  ];

  const fetchLeads = async (countryParam = selectedCountry, catParam = selectedCategory, customQueryParam = customSearchQuery) => {
    setIsLoading(true);
    setScanStepIndex(0);

    // Rapid radar telemetry sweep (ticking at 90ms for instant feedback)
    let step = 0;
    const stepInterval = setInterval(() => {
      step = (step + 1) % (scanTelemetrySteps.length - 1);
      setScanStepIndex(step);
    }, 90);

    try {
      const results = await scanOnlineJobsAndLeads({
        country: countryParam,
        category: catParam,
        industry: selectedIndustry,
        customQuery: customQueryParam,
      });
      setLeads(results);
    } catch (err) {
      console.warn('Failed to load live leads:', err);
    } finally {
      clearInterval(stepInterval);
      setScanStepIndex(scanTelemetrySteps.length - 1);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedCountry, selectedCategory, selectedIndustry]);

  const toggleSaveLead = (id: string) => {
    setSavedLeadIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('testimony_saved_leads', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleCopyPitch = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyContact = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(id);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      'Type',
      'Title',
      'Business Name',
      'Country',
      'City',
      'Industry',
      'Website',
      'Issue / Need',
      'Budget',
      'Contact Person',
      'Email',
      'Phone / WhatsApp',
      'Pitch Angle'
    ];

    const rows = leads.map((l) => [
      `"${l.type}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${l.country}"`,
      `"${l.city || ''}"`,
      `"${l.industry}"`,
      `"${l.websiteUrl || ''}"`,
      `"${l.issueOrNeed.replace(/"/g, '""')}"`,
      `"${l.estimatedBudget}"`,
      `"${(l.contactPerson || '').replace(/"/g, '""')}"`,
      `"${l.contactEmail || ''}"`,
      `"${l.contactPhoneOrWhatsApp || ''}"`,
      `"${l.pitchAngle.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Testimony_Radar_Leads_${selectedCountry}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to build direct WhatsApp link
  const getWhatsAppLink = (phone?: string, businessName?: string, pitch?: string) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const greeting = `Hello ${businessName ? businessName : ''}! I am reaching out regarding your website. ${pitch || ''}`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(greeting)}`;
  };

  const failingWebsitesCount = leads.filter((l) => l.type === 'website_fix').length;
  const urgentHelpCount = leads.filter((l) => l.type === 'online_help').length;
  const remoteJobsCount = leads.filter((l) => l.type === 'remote_job').length;

  const quickScanPresets = [
    { label: '🛒 Failing Stores in Lagos', query: 'E-commerce fashion and retail stores in Lagos with slow checkout and broken mobile websites' },
    { label: '🩺 Clinics in Abuja', query: 'Dental clinics and private hospitals in Abuja with outdated or non-mobile websites' },
    { label: '🏨 Hotels in Port Harcourt', query: 'Hotels and resorts in Port Harcourt with no mobile booking system' },
    { label: '💻 Remote React/Node Jobs', query: 'Remote software developer jobs in Nigeria and worldwide paying in USD' },
    { label: '🏢 Real Estate in Lagos', query: 'Real estate agencies in Victoria Island Lagos with no WhatsApp lead capture' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c16] text-slate-100 overflow-y-auto">
      {/* TOP RADAR HUD BANNER */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/40 p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            {/* Visual Radar Screen Widget */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950 border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden">
              {/* Concentric distance rings */}
              <div className="absolute w-3/4 h-3/4 rounded-full border border-emerald-500/20" />
              <div className="absolute w-1/2 h-1/2 rounded-full border border-emerald-500/30" />
              <div className="absolute w-1/4 h-1/4 rounded-full border border-emerald-500/40" />

              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-emerald-500/20" />
              <div className="absolute h-full w-[1px] bg-emerald-500/20" />

              {/* Sweeping Radar Beam */}
              <div
                className={`absolute inset-0 origin-center bg-gradient-to-tr from-emerald-500/40 via-transparent to-transparent ${
                  isLoading ? 'animate-spin duration-700' : 'animate-spin-slow'
                }`}
              />

              {/* Pinging Target Blips */}
              <span className="absolute top-4 right-5 w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,1)]" />
              <span className="absolute bottom-5 left-6 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="absolute top-7 left-4 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />

              {/* Center Beacon */}
              <div className="relative z-10 w-3 h-3 rounded-full bg-emerald-400 border border-white shadow-sm" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
                <RadarIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>INTELLIGENCE SCANNING RADAR</span>
                <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">| 360° SWEEP ACTIVE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Market Radar: Failing Websites &amp; High-Paying Remote Jobs
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Tell the radar to scan anything. It scans businesses with broken, slow, or outdated websites that badly need fixing, companies seeking urgent online help, and verified remote jobs with direct decision-maker contact details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchLeads()}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Radar Sweeping...' : 'Re-Sweep Radar'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download all scanned business leads & jobs into CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/60">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Acquired Targets</span>
            <span className="text-lg font-black text-white">{leads.length} Verified</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-rose-500/25">
            <span className="text-[11px] text-rose-300 block font-medium">Failing Websites to Fix</span>
            <span className="text-lg font-black text-rose-400">{failingWebsitesCount} High-Ticket</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/25">
            <span className="text-[11px] text-amber-300 block font-medium">Urgent Online Help</span>
            <span className="text-lg font-black text-amber-400">{urgentHelpCount} Openings</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/25">
            <span className="text-[11px] text-emerald-300 block font-medium">Verified Remote Jobs</span>
            <span className="text-lg font-black text-emerald-400">{remoteJobsCount} Remote</span>
          </div>
        </div>
      </div>

      {/* "TELL RADAR WHAT TO SCAN" COMMAND BAR & RESULTS - FULL SCREEN WIDTH */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-5 space-y-4 flex-1">
        <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchLeads(selectedCountry, selectedCategory, customSearchQuery);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Crosshair className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                placeholder="Tell the Radar what to scan... (e.g. 'Failing websites in Lagos', 'Dental clinics in Abuja', 'Remote Python jobs')..."
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RadarIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Target...' : 'Scan Anything'}</span>
            </button>
          </form>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Scans:</span>
            {quickScanPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setCustomSearchQuery(preset.query);
                  fetchLeads(selectedCountry, selectedCategory, preset.query);
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 sm:p-4 rounded-2xl">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Radar Targets ({leads.length})
            </button>
            <button
              onClick={() => setSelectedCategory('website_fix')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'website_fix'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failing Websites ({failingWebsitesCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('online_help')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'online_help'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Urgent Online Help ({urgentHelpCount})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('remote_job')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'remote_job'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-cyan-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Remote Jobs ({remoteJobsCount})</span>
            </button>
          </div>

          {/* Location & Industry Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Nigeria" className="bg-slate-900">🇳🇬 Nigeria (Lagos, Abuja, PH)</option>
                <option value="United States" className="bg-slate-900">🇺🇸 United States</option>
                <option value="United Kingdom" className="bg-slate-900">🇬🇧 United Kingdom</option>
                <option value="Canada" className="bg-slate-900">🇨🇦 Canada</option>
                <option value="Worldwide Remote" className="bg-slate-900">🌍 Worldwide Remote</option>
              </select>
            </div>

            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Sectors</option>
              <option value="Healthcare & Dental">Healthcare &amp; Dental</option>
              <option value="Real Estate & Hospitality">Real Estate &amp; Hotels</option>
              <option value="Logistics & Supply Chain">Logistics &amp; Transport</option>
              <option value="E-commerce & Retail">E-Commerce Stores</option>
              <option value="Legal Services">Law &amp; Legal</option>
              <option value="Software & Technology">Software &amp; Tech</option>
            </select>
          </div>
        </div>

        {/* LOADING RADAR TELEMETRY STREAM */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-8">
            <div className="relative w-16 h-16 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping" />
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            </div>

            <div className="space-y-1.5 max-w-lg">
              <p className="text-sm font-black text-emerald-400 tracking-wide font-mono">
                {scanTelemetrySteps[scanStepIndex]}
              </p>
              <p className="text-xs text-slate-400">
                Targeting: {customSearchQuery || `Commercial Ecosystem in ${selectedCountry}`}
              </p>
            </div>

            {/* Simulated Radar Progress Bar */}
            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${((scanStepIndex + 1) / scanTelemetrySteps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Targets Detected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The radar could not find targets for this specific filter. Try broadening the search query or switching regions.
            </p>
            <button
              onClick={() => {
                setSelectedCountry('Nigeria');
                setSelectedCategory('all');
                setSelectedIndustry('all');
                setCustomSearchQuery('');
                fetchLeads('Nigeria', 'all', '');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              Reset to Full Nigeria Sweep
            </button>
          </div>
        ) : (
          /* LEADS GRID CARDS - FULL SCREEN RESPONSIVE COVERAGE */
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 w-full">
            {leads.map((lead) => {
              const isSaved = savedLeadIds.includes(lead.id);
              const isWebsiteFix = lead.type === 'website_fix';
              const isOnlineHelp = lead.type === 'online_help';
              const isRemoteJob = lead.type === 'remote_job';
              const whatsappLink = getWhatsAppLink(lead.contactPhoneOrWhatsApp, lead.businessName, lead.pitchAngle);

              return (
                <div
                  key={lead.id}
                  className="rounded-3xl p-5 bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xl group relative overflow-hidden"
                >
                  <div>
                    {/* Top Type & Urgency Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isWebsiteFix && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Failing Website (Needs Fix)</span>
                          </span>
                        )}
                        {isOnlineHelp && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1 shadow-xs">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Urgent Online Help</span>
                          </span>
                        )}
                        {isRemoteJob && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1 shadow-xs">
                            <Briefcase className="w-3 h-3 text-cyan-400" />
                            <span>Remote Online Job</span>
                          </span>
                        )}
                        {lead.pageSpeedScore && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono shadow-xs">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            <span>Speed: {lead.pageSpeedScore}</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {lead.industry}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleSaveLead(lead.id)}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                        title={isSaved ? 'Remove from saved' : 'Save this lead'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Business / Job Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                      {lead.title}
                    </h3>

                    {/* Company Name & Location */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        {lead.businessName}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {lead.city ? `${lead.city}, ` : ''}{lead.country}
                      </span>
                    </div>

                    {/* Verified Exact Physical Street Address */}
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-300 mt-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="text-slate-400 font-semibold mr-1">Exact Address:</span>
                        <span className="text-slate-200 font-medium">{lead.exactAddress || `${lead.city ? `${lead.city}, ` : ''}${lead.country}`}</span>
                      </div>
                    </div>

                    {/* Website URL & Status */}
                    {lead.websiteUrl && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[280px]">
                          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate">{lead.websiteUrl}</span>
                        </div>
                        <a
                          href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 shrink-0 ml-2"
                        >
                          <span>Inspect Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Breakdown of why their website is failing / urgent problem */}
                    <div className="mt-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                      <div className="font-bold text-rose-300 flex items-center gap-1 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>Radar Diagnostic (Problem &amp; Revenue Risk):</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {lead.issueOrNeed}
                      </p>
                    </div>

                    {/* Estimated Budget / Pay */}
                    <div className="mt-3 flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                      <span className="text-slate-300 font-medium">Estimated Budget / Contract Value:</span>
                      <span className="font-black text-emerald-300 text-xs sm:text-sm">
                        {lead.estimatedBudget}
                      </span>
                    </div>

                    {/* Contact Details Dossier */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                        <span>Direct Decision Maker Dossier:</span>
                        {lead.contactTitle && (
                          <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">{lead.contactTitle}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {lead.contactPerson && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold">
                            👤 {lead.contactPerson} {lead.contactTitle ? `(${lead.contactTitle})` : ''}
                          </span>
                        )}
                        {lead.contactEmail && (
                          <button
                            onClick={() => handleCopyContact(lead.contactEmail, `${lead.id}_email`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] transition cursor-pointer"
                            title="Click to copy email"
                          >
                            <Mail className="w-3 h-3 text-cyan-400" />
                            <span>{lead.contactEmail}</span>
                            {copiedContact === `${lead.id}_email` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        )}
                        {lead.contactPhoneOrWhatsApp && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[11px] font-medium font-mono">
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                            <span>{lead.contactPhoneOrWhatsApp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar with 1-Click WhatsApp, Email & Outreach Pitch */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePitchLead(lead)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>1-Click AI Outreach Pitch</span>
                    </button>

                    {/* Direct WhatsApp Launch */}
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-sm"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    {/* Direct Email Launch */}
                    {lead.contactEmail && (
                      <a
                        href={`mailto:${lead.contactEmail}?subject=${encodeURIComponent(`Website Enhancement & Performance Proposal for ${lead.businessName}`)}&body=${encodeURIComponent(lead.pitchAngle)}`}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Send Direct Email"
                      >
                        <Send className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PITCH MODAL */}
      {activePitchLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Cold Outreach Pitch for {activePitchLead.businessName}
                </h3>
              </div>
              <button
                onClick={() => setActivePitchLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-semibold">Recipient:</div>
              <div className="text-white font-bold">
                {activePitchLead.contactPerson || activePitchLead.businessName} ({activePitchLead.contactEmail || activePitchLead.contactPhoneOrWhatsApp || 'General Contact'})
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Tailored Outreach Pitch (Ready to Send):
              </label>
              <textarea
                value={activePitchLead.pitchAngle}
                onChange={(e) =>
                  setActivePitchLead({ ...activePitchLead, pitchAngle: e.target.value })
                }
                rows={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyPitch(activePitchLead.pitchAngle)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                {copiedPitch ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Pitch</span>
                  </>
                )}
              </button>

              {getWhatsAppLink(activePitchLead.contactPhoneOrWhatsApp, activePitchLead.businessName, activePitchLead.pitchAngle) && (
                <a
                  href={getWhatsAppLink(activePitchLead.contactPhoneOrWhatsApp, activePitchLead.businessName, activePitchLead.pitchAngle)!}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
