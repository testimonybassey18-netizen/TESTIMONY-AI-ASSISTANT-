import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Check,
  Eye,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Printer,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { CvData } from '../types';
import { callGeminiGenerate } from '../services/geminiService';

interface CvResumeBuilderViewProps {
  onOpenSubscriptionModal: () => void;
  isPro: boolean;
}

export const CvResumeBuilderView: React.FC<CvResumeBuilderViewProps> = ({
  onOpenSubscriptionModal,
  isPro,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [template, setTemplate] = useState<'modern' | 'minimal' | 'classic' | 'executive'>('modern');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const [cv, setCv] = useState<CvData>(() => {
    const saved = localStorage.getItem('testimony_cv_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      fullName: 'Testimony Bassey',
      email: 'testimonybassey18@gmail.com',
      phone: '+1 (555) 234-5678',
      location: 'London, UK / Remote',
      websiteOrLinkedIn: 'linkedin.com/in/testimony',
      targetJobTitle: 'Senior Software Engineer & Product Builder',
      professionalSummary:
        'Results-driven software engineer and solutions architect with extensive experience delivering scalable web systems, intuitive user interfaces, and automated workflows. Passionate about empowering global communities through dependable technology and modern design.',
      education: [
        {
          id: '1',
          institution: 'University of Technology',
          degree: 'BSc Computer Science & Engineering',
          field: 'Software Engineering',
          startDate: '2019',
          endDate: '2023',
          highlights: 'Graduated with First Class Honors. President of Computing Society.',
        },
      ],
      experience: [
        {
          id: '1',
          company: 'Nexus Tech Global',
          role: 'Lead Full-Stack Developer',
          location: 'Remote',
          startDate: '2023',
          endDate: 'Present',
          current: true,
          responsibilities:
            'Architected distributed frontend and API microservices handling 250k+ monthly active users. Reduced latency by 42% through efficient data structures and caching. Mentored team of 5 junior engineers.',
        },
      ],
      skills: ['TypeScript', 'React', 'Node.js', 'Express', 'Tailwind CSS', 'PostgreSQL', 'API Architecture', 'System Design'],
      certifications: [
        { id: '1', name: 'Google Cloud Certified Cloud Architect', issuer: 'Google', year: '2024' },
      ],
      projects: [
        {
          id: '1',
          title: 'Testimony AI Platform',
          description: 'Multifunctional global productivity assistant supporting assignments, CVs, and data intelligence.',
          link: 'https://testimony-ai.dev',
        },
      ],
      languages: [
        { id: '1', language: 'English', proficiency: 'Native' },
        { id: '2', language: 'French', proficiency: 'Professional' },
      ],
      template: 'modern',
    };
  });

  const saveToStorage = (updated: CvData) => {
    setCv(updated);
    localStorage.setItem('testimony_cv_data', JSON.stringify(updated));
  };

  // AI Summary Generator
  const handleGenerateSummary = async () => {
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const prompt = `Write an ATS-friendly, punchy, high-impact professional CV summary (3-4 sentences max) for a candidate targeting the role: "${cv.targetJobTitle}".
Candidate background:
- Current Experience: ${cv.experience.map((e) => `${e.role} at ${e.company} (${e.responsibilities})`).join('; ')}
- Skills: ${cv.skills.join(', ')}
- Education: ${cv.education.map((ed) => `${ed.degree} from ${ed.institution}`).join('; ')}

Never invent certifications or false employment. Frame real capabilities with strong action verbs. Return ONLY the polished summary text.`;

      const generated = await callGeminiGenerate({
        prompt,
        systemInstruction: 'You are an executive CV writer and ATS optimization expert.',
        temperature: 0.5,
      });

      if (generated) {
        saveToStorage({ ...cv, professionalSummary: generated.trim() });
        setAiNotice('Professional Summary generated & updated!');
      }
    } catch (err: any) {
      setAiNotice('AI suggestion failed: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Skill Suggester
  const handleSuggestSkills = async () => {
    setIsAiLoading(true);
    setAiNotice(null);
    try {
      const prompt = `Given the target job title "${cv.targetJobTitle}" and experience: "${cv.experience.map((e) => e.role).join(', ')}", provide a comma-separated list of 8 high-demand, relevant hard and soft skills for this position. Do not invent company names or false accreditations. Return ONLY comma-separated skills.`;

      const res = await callGeminiGenerate({
        prompt,
        systemInstruction: 'You are an expert technical talent recruiter.',
        temperature: 0.4,
      });

      if (res) {
        const newSkills = res
          .split(',')
          .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter((s) => s.length > 1 && !cv.skills.includes(s));
        saveToStorage({ ...cv, skills: [...cv.skills, ...newSkills] });
        setAiNotice(`Added ${newSkills.length} recommended skills!`);
      }
    } catch (err: any) {
      setAiNotice('Skill suggestion error: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Print as PDF
  const handlePrintPdf = () => {
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Add / Remove item helpers
  const addExperience = () => {
    const updated = {
      ...cv,
      experience: [
        ...cv.experience,
        {
          id: Date.now().toString(),
          company: '',
          role: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          responsibilities: '',
        },
      ],
    };
    saveToStorage(updated);
  };

  const removeExperience = (id: string) => {
    saveToStorage({ ...cv, experience: cv.experience.filter((e) => e.id !== id) });
  };

  const addEducation = () => {
    const updated = {
      ...cv,
      education: [
        ...cv.education,
        {
          id: Date.now().toString(),
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          highlights: '',
        },
      ],
    };
    saveToStorage(updated);
  };

  const removeEducation = (id: string) => {
    saveToStorage({ ...cv, education: cv.education.filter((e) => e.id !== id) });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>ATS Career Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            AI CV &amp; Resume Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Build ATS-friendly, executive-ready resumes with instant PDF export.
          </p>
        </div>

        {/* Tab switch & Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'edit' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Edit Form
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={handlePrintPdf}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {aiNotice && (
        <div className="no-print p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-center justify-between">
          <span>{aiNotice}</span>
          <button onClick={() => setAiNotice(null)} className="text-purple-400 hover:text-white">✕</button>
        </div>
      )}

      {/* EDIT TAB */}
      {activeTab === 'edit' && (
        <div className="space-y-6">
          {/* Personal Info Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Contact &amp; Role Details</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={cv.fullName}
                  onChange={(e) => saveToStorage({ ...cv, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Title</label>
                <input
                  type="text"
                  value={cv.targetJobTitle}
                  onChange={(e) => saveToStorage({ ...cv, targetJobTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={cv.email}
                  onChange={(e) => saveToStorage({ ...cv, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={cv.phone}
                  onChange={(e) => saveToStorage({ ...cv, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={cv.location}
                  onChange={(e) => saveToStorage({ ...cv, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn / Portfolio</label>
                <input
                  type="text"
                  value={cv.websiteOrLinkedIn}
                  onChange={(e) => saveToStorage({ ...cv, websiteOrLinkedIn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Professional Summary</h2>
                <p className="text-xs text-slate-400">Brief narrative summarizing key achievements</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Auto-Generate Summary</span>
              </button>
            </div>
            <textarea
              value={cv.professionalSummary}
              onChange={(e) => saveToStorage({ ...cv, professionalSummary: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-100"
            />
          </div>

          {/* Work Experience */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span>Work Experience</span>
              </h2>
              <button
                onClick={addExperience}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {cv.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Position #{idx + 1}</span>
                  {cv.experience.length > 1 && (
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Job Title / Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...cv.experience];
                        updated[idx].role = e.target.value;
                        saveToStorage({ ...cv, experience: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...cv.experience];
                        updated[idx].company = e.target.value;
                        saveToStorage({ ...cv, experience: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Dates (e.g. 2022 - Present)</label>
                    <input
                      type="text"
                      value={`${exp.startDate} - ${exp.endDate}`}
                      onChange={(e) => {
                        const updated = [...cv.experience];
                        const parts = e.target.value.split('-');
                        updated[idx].startDate = parts[0]?.trim() || '';
                        updated[idx].endDate = parts[1]?.trim() || '';
                        saveToStorage({ ...cv, experience: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Key Responsibilities &amp; Metrics</label>
                  <textarea
                    rows={2}
                    value={exp.responsibilities}
                    onChange={(e) => {
                      const updated = [...cv.experience];
                      updated[idx].responsibilities = e.target.value;
                      saveToStorage({ ...cv, experience: updated });
                    }}
                    placeholder="Led project, improved conversion by 25%, implemented..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Education & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Education</span>
                </h2>
                <button
                  onClick={addEducation}
                  className="p-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {cv.education.map((edu, idx) => (
                <div key={edu.id} className="p-3 bg-slate-950 rounded-xl space-y-2 text-xs">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...cv.education];
                      updated[idx].degree = e.target.value;
                      saveToStorage({ ...cv, education: updated });
                    }}
                    placeholder="Degree / Qualification"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...cv.education];
                      updated[idx].institution = e.target.value;
                      saveToStorage({ ...cv, education: updated });
                    }}
                    placeholder="Institution / University"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Skills &amp; Competencies</span>
                </h2>
                <button
                  onClick={handleSuggestSkills}
                  disabled={isAiLoading}
                  className="px-2 py-1 rounded bg-purple-600/30 text-purple-200 text-xs font-semibold hover:bg-purple-600/50 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Suggest</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {cv.skills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() =>
                        saveToStorage({ ...cv, skills: cv.skills.filter((_, i) => i !== sIdx) })
                      }
                      className="text-slate-400 hover:text-rose-400 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder="Type new skill and press Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const newS = e.currentTarget.value.trim();
                    if (!cv.skills.includes(newS)) {
                      saveToStorage({ ...cv, skills: [...cv.skills, newS] });
                    }
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW & PRINT TAB */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Choose Template:</span>
              {(['modern', 'minimal', 'classic', 'executive'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                    template === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrintPdf}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save / Print PDF</span>
            </button>
          </div>

          {/* Formatted CV Document Canvas */}
          <div className="print-container bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 max-w-4xl mx-auto border border-slate-300 min-h-[900px]">
            {/* Header / Contact */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
                {cv.fullName || 'Candidate Name'}
              </h1>
              <p className="text-base font-bold text-purple-800 tracking-wide mt-1">
                {cv.targetJobTitle || 'Professional Title'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
                {cv.email && <span>{cv.email}</span>}
                {cv.phone && <span>• {cv.phone}</span>}
                {cv.location && <span>• {cv.location}</span>}
                {cv.websiteOrLinkedIn && <span>• {cv.websiteOrLinkedIn}</span>}
              </div>
            </div>

            {/* Summary */}
            {cv.professionalSummary && (
              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {cv.professionalSummary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {cv.experience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                  Experience &amp; Career History
                </h2>
                <div className="space-y-4">
                  {cv.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm text-slate-950">{exp.role}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-purple-900">{exp.company}</div>
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                        {exp.responsibilities}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Education &amp; Credentials
                </h2>
                <div className="space-y-2">
                  {cv.education.map((edu) => (
                    <div key={edu.id} className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-950">{edu.degree}</span>
                        <span className="text-slate-600"> — {edu.institution}</span>
                      </div>
                      <span className="text-slate-500">{edu.startDate} - {edu.endDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cv.skills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Skills &amp; Competencies
                </h2>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-800">
                  {cv.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
