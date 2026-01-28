
import React, { useState, useRef, useEffect } from 'react';
import { NicheData } from '../types';
import { analyzeVideoUrl } from '../services/geminiService';
import { 
    Link, Loader2, Sparkles, Save, X, CheckCircle, AlertCircle, 
    Tag, Globe, Calendar, Users, BarChart2, Video, FileText, Upload, RefreshCw,
    Heart, MessageCircle, Share2, BrainCircuit, Play, PlayCircle, Eye
} from 'lucide-react';

interface AddVideoPageProps {
  onAddNiche: (niche: NicheData, preventRedirect?: boolean) => void;
}

export const AddVideoPage: React.FC<AddVideoPageProps> = ({ onAddNiche }) => {
  // --- MODE STATE ---
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // --- SINGLE MODE STATE ---
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [scannedData, setScannedData] = useState<NicheData | null>(null);

  // --- BULK MODE STATE ---
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkLogs, setBulkLogs] = useState<{msg: string, type: 'info'|'success'|'error'}[]>([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [bulkCompleted, setBulkCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories match the Sidebar EXACTLY
  const CATEGORIES = [
      'Horror', 
      'Gaming', 
      'AI Automation', 
      'Stories', 
      'Motivation', 
      'Cars', 
      'Geography',
      'Business',
      'Fitness'
  ];

  // Prevent Navigation Warning
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (isBulkProcessing) {
              e.preventDefault();
              e.returnValue = "Bulk import is in progress. Are you sure you want to leave?";
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isBulkProcessing]);

  // Helper to parse strings like "1.2M" to numbers for validation
  const parseStat = (val: string | number | undefined): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const str = val.toString().replace(/,/g, '');
      const multiplier = str.toUpperCase().includes('M') ? 1000000 : str.toUpperCase().includes('K') ? 1000 : 1;
      return parseFloat(str.replace(/[^0-9.]/g, '')) * multiplier || 0;
  };

  const formatCompact = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return val.toString();
  };

  // --- SINGLE: ANALYZE ---
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setScannedData(null);

    if (!url) {
      setError('Please enter a valid TikTok or YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const nicheData = await analyzeVideoUrl(url);
      setScannedData(nicheData);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze video. Ensure the link is correct and accessible.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- SINGLE: EDIT FIELD ---
  const handleFieldChange = (field: keyof NicheData, value: any) => {
    if (scannedData) {
      setScannedData({ ...scannedData, [field]: value });
    }
  };

  // --- SINGLE: SAVE ---
  const handleSave = () => {
    if (scannedData) {
        onAddNiche(scannedData);
        setScannedData(null);
        setUrl('');
    }
  };

  // --- BULK: FILE HANDLER ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setBulkFile(e.target.files[0]);
          setBulkLogs([]);
          setBulkProgress({ current: 0, total: 0, success: 0, failed: 0 });
          setBulkCompleted(false);
      }
  };

  // --- STRICT DATA VALIDATION FOR BULK ---
  const validateNicheData = (data: NicheData): { valid: boolean; reason?: string } => {
      // 1. Basic Stats Check
      const views = parseStat(data.views);
      
      if (views <= 0) return { valid: false, reason: "0 Views Detected (Invalid Video)" };
      
      // 2. Real Data Verification (Duration check)
      // If duration is 0, it means we likely got account-level data fallback, not specific video data
      if (!data.duration || data.duration === 0) {
          return { valid: false, reason: "Video Metrics Unavailable (Duration 0)" };
      }

      // 3. Dummy Data Check (AI Fallbacks)
      if (data.title === "No description provided." || !data.title || data.title.trim() === "" || data.title.includes("Video by @")) {
          // Strict check: if title is just generic "Video by @user", consider it a bad scrape
          if (data.title.includes("Video by @")) return { valid: false, reason: "Generic Title (Bad Scrape)" };
          if (!data.title) return { valid: false, reason: "Missing Title" };
      }
      
      // 4. AI Hallucination Check
      // If the AI service fails to scrape but returns a generic object
      if (data.deep_analysis?.primary_niche === "General" && data.deep_analysis?.sub_niche === "Variety") {
          return { valid: false, reason: "AI Analysis Failed (Generic Data)" };
      }

      // 5. Video ID Check
      if (!data.video_id) {
          return { valid: false, reason: "Could not extract Video ID" };
      }

      return { valid: true };
  };

  // --- BULK: PROCESS LOGIC ---
  const processBulkImport = async () => {
      if (!bulkFile || !bulkCategory) return;

      setIsBulkProcessing(true);
      setBulkCompleted(false);
      setBulkLogs([{ msg: `🚀 Starting bulk import sequence...`, type: 'info' }]);

      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) {
              setIsBulkProcessing(false);
              return;
          }

          // Split by newlines and filter empty lines
          const urls = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0 && (line.includes('tiktok.com') || line.includes('youtube.com')));
          
          setBulkProgress({ current: 0, total: urls.length, success: 0, failed: 0 });
          setBulkLogs(prev => [...prev, { msg: `📂 Found ${urls.length} valid links. Initializing Analysis Engine...`, type: 'info' }]);

          for (let i = 0; i < urls.length; i++) {
              const currentUrl = urls[i];
              setBulkProgress(prev => ({ ...prev, current: i + 1 }));
              
              // Helper to show progress in log
              setBulkLogs(prev => [...prev, { msg: `🔍 Analyzing (${i+1}/${urls.length}): ${currentUrl.substring(0, 40)}...`, type: 'info' }]);

              try {
                  // 1. Analyze
                  const nicheData = await analyzeVideoUrl(currentUrl);
                  
                  // 2. Validate against dummy/empty data
                  const validation = validateNicheData(nicheData);

                  if (validation.valid) {
                      // 3. Assign Category & Add
                      nicheData.category = bulkCategory;
                      
                      // CRITICAL: PASS true TO PREVENT REDIRECT
                      onAddNiche(nicheData, true);
                      
                      setBulkProgress(prev => ({ ...prev, success: prev.success + 1 }));
                      
                      const v = formatCompact(parseStat(nicheData.views));
                      const l = formatCompact(parseStat(nicheData.engagement.likes));
                      const s = formatCompact(parseStat(nicheData.engagement.shares));
                      const c = formatCompact(parseStat(nicheData.engagement.comments));
                      const cleanTitle = nicheData.title.length > 30 ? nicheData.title.substring(0, 30) + '...' : nicheData.title;

                      setBulkLogs(prev => [...prev, { 
                          msg: `✅ [ADDED] ${cleanTitle} | 👁️ ${v} Views | ❤️ ${l} Likes | 💬 ${c} Comments | 🔗 ${s} Shares`, 
                          type: 'success' 
                      }]);
                  } else {
                      // Failed Validation
                      setBulkProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
                      setBulkLogs(prev => [...prev, { 
                          msg: `❌ [FAILED] ${validation.reason}. Skipped.`, 
                          type: 'error' 
                      }]);
                  }

              } catch (err) {
                  // Network/API Error
                  setBulkProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
                  setBulkLogs(prev => [...prev, { msg: `❌ [ERROR] API Timeout/Failure. Skipped.`, type: 'error' }]);
              }

              // Small delay to prevent rate limits
              await new Promise(r => setTimeout(r, 2000));
          }

          setBulkLogs(prev => [...prev, { msg: `🏁 Bulk Operation Finished. Check summary above.`, type: 'info' }]);
          setIsBulkProcessing(false);
          setBulkCompleted(true);
      };

      reader.readAsText(bulkFile);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4 shadow-lg shadow-blue-500/20 border border-blue-500/20">
            <Video size={32} className="text-blue-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Add New Videos</h1>
        <p className="text-muted mt-2 max-w-lg mx-auto text-sm md:text-base">
          Analyze videos for niche stats and monetization potential.
        </p>
      </div>

      {/* MODE SWITCHER */}
      <div className="flex justify-center mb-8">
          <div className="bg-surface border border-border rounded-full p-1 flex items-center gap-1 overflow-x-auto max-w-full">
              <button 
                onClick={() => { setMode('single'); setScannedData(null); }}
                className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted hover:text-foreground'}`}
              >
                  Single Video
              </button>
              <button 
                onClick={() => { setMode('bulk'); setScannedData(null); }}
                className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'bulk' ? 'bg-purple-600 text-white shadow-lg' : 'text-muted hover:text-foreground'}`}
              >
                  <FileText size={14} className="hidden sm:inline" /> Bulk Import
              </button>
          </div>
      </div>

      {/* =====================================================================================
          MODE: SINGLE VIDEO 
      ===================================================================================== */}
      {mode === 'single' && (
        <>
            {/* STEP 1: INPUT */}
            {!scannedData && (
                <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                    
                    <form onSubmit={handleAnalyze} className="relative z-10 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Link className="absolute left-4 top-4 text-muted w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste TikTok or YouTube Link here..." 
                                className="w-full bg-background dark:bg-black/50 border border-border rounded-xl py-4 pl-12 pr-4 text-foreground dark:text-white placeholder-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-base md:text-lg font-mono"
                                disabled={isAnalyzing}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isAnalyzing || !url}
                            className={`px-8 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                                isAnalyzing || !url 
                                ? 'bg-muted/50 cursor-not-allowed text-muted-foreground' 
                                : 'bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] shadow-lg shadow-blue-600/20'
                            }`}
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: REVIEW & CATEGORIZE */}
            {scannedData && (
                <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom-8 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Review & Categorize</h2>
                                <p className="text-sm text-muted">Review the <strong>Real Accurate Data</strong> before adding.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setScannedData(null)}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* LEFT: CONFIGURATION */}
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl">
                                <label className="text-sm text-blue-500 dark:text-blue-300 block mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Tag size={14} /> Select Category Feed
                                </label>
                                <select 
                                    value={scannedData.category}
                                    onChange={(e) => handleFieldChange('category', e.target.value)}
                                    className="w-full bg-background dark:bg-black/50 border border-blue-500/50 rounded-lg p-3 text-foreground dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-lg"
                                >
                                    <option value="" disabled>-- Select Feed --</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-muted block mb-1">Title (Editable)</label>
                                <input 
                                    type="text" 
                                    value={scannedData.title} 
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:border-primary focus:outline-none"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-border">
                                    <label className="text-[10px] text-muted block mb-1 uppercase flex items-center gap-1"><BrainCircuit size={10} /> AI Primary Niche</label>
                                    <div className="text-sm font-bold text-foreground">{scannedData.deep_analysis?.primary_niche || "Unknown"}</div>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-border">
                                    <label className="text-[10px] text-muted block mb-1 uppercase flex items-center gap-1"><BrainCircuit size={10} /> AI Sub-Niche</label>
                                    <div className="text-sm font-bold text-purple-600 dark:text-purple-300">{scannedData.deep_analysis?.sub_niche || "Unknown"}</div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: REAL STATS PREVIEW (EXPANDED) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <BarChart2 size={16} className="text-green-500" /> Captured Real-Time Stats
                            </h3>
                            
                            {/* Primary Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface border border-border p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase"><Play size={12}/> Views</div>
                                    <div className="text-lg font-black text-foreground">{scannedData.views}</div>
                                </div>
                                <div className="bg-surface border border-border p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase"><Users size={12}/> Followers</div>
                                    <div className="text-lg font-black text-foreground">{(scannedData.author_stats?.followers || 0).toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Engagement Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-surface border border-border p-3 rounded-xl text-center">
                                    <Heart size={16} className="text-red-500 mx-auto mb-1" />
                                    <div className="text-xs text-muted font-bold uppercase mb-1">Likes</div>
                                    <div className="text-sm font-black text-foreground">{scannedData.engagement.likes}</div>
                                </div>
                                <div className="bg-surface border border-border p-3 rounded-xl text-center">
                                    <MessageCircle size={16} className="text-blue-500 mx-auto mb-1" />
                                    <div className="text-xs text-muted font-bold uppercase mb-1">Comments</div>
                                    <div className="text-sm font-black text-foreground">{scannedData.engagement.comments}</div>
                                </div>
                                <div className="bg-surface border border-border p-3 rounded-xl text-center">
                                    <Share2 size={16} className="text-green-500 mx-auto mb-1" />
                                    <div className="text-xs text-muted font-bold uppercase mb-1">Shares</div>
                                    <div className="text-sm font-black text-foreground">{scannedData.engagement.shares}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface border border-border p-3 rounded-xl flex items-center gap-2">
                                    <Globe size={14} className="text-blue-400"/> 
                                    <span className="text-sm font-bold text-foreground">Region: {scannedData.region}</span>
                                </div>
                                <div className="bg-surface border border-border p-3 rounded-xl flex items-center gap-2">
                                    <Calendar size={14} className="text-purple-400"/> 
                                    <span className="text-sm font-bold text-foreground">
                                        {scannedData.create_time ? new Date(scannedData.create_time * 1000).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Channel Info */}
                            <div className="mt-2 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-border flex items-center gap-3">
                                <img 
                                    src={scannedData.channel_avatar_url || "https://via.placeholder.com/40"} 
                                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
                                />
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-foreground truncate">{scannedData.channel_name}</div>
                                    <div className="text-xs text-muted truncate">@{scannedData.channel_handle || "handle"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button 
                            onClick={() => setScannedData(null)}
                            className="flex-1 py-4 bg-surface border border-border text-foreground rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!scannedData.category}
                            className={`flex-[2] py-4 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                                !scannedData.category 
                                ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                                : 'bg-green-600 hover:bg-green-500 hover:scale-[1.01] shadow-green-600/20'
                            }`}
                        >
                            <Save size={18} />
                            Confirm & Add to {scannedData.category || 'Feed'}
                        </button>
                    </div>
                </div>
            )}
        </>
      )}

      {/* =====================================================================================
          MODE: BULK UPLOAD 
      ===================================================================================== */}
      {mode === 'bulk' && (
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in fade-in transition-colors duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  
                  {/* LEFT: CONFIGURATION */}
                  <div className="space-y-6">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                          <Upload className="text-purple-400" /> Batch Configuration
                      </h2>

                      {/* 1. Category Selection */}
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-muted">Target Category (Required)</label>
                          <select 
                              value={bulkCategory}
                              onChange={(e) => setBulkCategory(e.target.value)}
                              className="w-full bg-background dark:bg-black/50 border border-border rounded-xl p-3 text-foreground dark:text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              disabled={isBulkProcessing}
                          >
                              <option value="" disabled>-- Select Category for All Links --</option>
                              {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                          <p className="text-xs text-muted">All valid videos will be added to the <strong>{bulkCategory || '...'}</strong> feed automatically.</p>
                      </div>

                      {/* 2. File Upload */}
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-muted">Upload CSV or TXT</label>
                          <div 
                            className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 hover:border-purple-500/50 transition-all bg-background dark:bg-black/20"
                            onClick={() => !isBulkProcessing && fileInputRef.current?.click()}
                          >
                              <input 
                                  type="file" 
                                  accept=".csv, .txt" 
                                  ref={fileInputRef}
                                  className="hidden"
                                  onChange={handleFileChange}
                                  disabled={isBulkProcessing}
                              />
                              {bulkFile ? (
                                  <div className="flex items-center gap-2 text-green-500 font-bold">
                                      <FileText size={24} />
                                      {bulkFile.name}
                                  </div>
                              ) : (
                                  <>
                                      <Upload size={24} className="text-muted mb-2" />
                                      <span className="text-sm text-foreground">Click to upload video links</span>
                                      <span className="text-xs text-muted mt-1">One link per line</span>
                                  </>
                              )}
                          </div>
                      </div>

                      {/* 3. Action Button */}
                      <button 
                          onClick={processBulkImport}
                          disabled={!bulkFile || !bulkCategory || isBulkProcessing}
                          className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                              !bulkFile || !bulkCategory || isBulkProcessing
                              ? 'bg-gray-500 cursor-not-allowed opacity-50'
                              : 'bg-purple-600 hover:bg-purple-500 hover:scale-[1.01] shadow-purple-600/20'
                          }`}
                      >
                          {isBulkProcessing ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                          {isBulkProcessing ? 'Processing Batch... (Do Not Leave)' : 'Start Bulk Import'}
                      </button>
                      
                      {/* SUMMARY MESSAGE (When Done) */}
                      {bulkCompleted && (
                          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${bulkProgress.failed === 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                              <CheckCircle size={20} />
                              <div className="flex-1">
                                  <div className="font-bold">Batch Complete</div>
                                  <div className="text-xs opacity-90">
                                      {bulkProgress.success} Added Successfully · {bulkProgress.failed} Failed Validation
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* RIGHT: TERMINAL / LOGS */}
                  <div className="bg-[#0c0c0e] border border-gray-800 rounded-xl p-4 font-mono text-xs flex flex-col h-[450px] shadow-inner relative overflow-hidden">
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2 z-10">
                          <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              System Terminal
                          </span>
                          {isBulkProcessing && <span className="animate-pulse text-purple-400 font-bold">● LIVE PROCESSING</span>}
                      </div>
                      
                      {/* Progress Bar (Visual) */}
                      <div className="mb-4 space-y-1 z-10">
                          <div className="flex justify-between text-[10px] text-gray-500">
                              <span>Progress: {bulkProgress.total > 0 ? Math.round((bulkProgress.current / bulkProgress.total) * 100) : 0}%</span>
                              <span>{bulkProgress.current} / {bulkProgress.total}</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
                              ></div>
                          </div>
                      </div>

                      {/* Log Output */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pb-2 z-10">
                          {bulkLogs.length === 0 ? (
                              <div className="text-gray-600 italic h-full flex items-center justify-center flex-col gap-2">
                                  <div className="p-3 rounded-full border border-dashed border-gray-700">
                                      <FileText className="text-gray-700" />
                                  </div>
                                  <span>Ready for input...</span>
                              </div>
                          ) : (
                              bulkLogs.map((log, i) => (
                                  <div key={i} className={`pl-2 border-l-2 py-0.5 ${
                                      log.type === 'success' ? 'border-green-500 text-green-400' : 
                                      log.type === 'error' ? 'border-red-500 text-red-400' : 
                                      'border-gray-600 text-gray-300'
                                  }`}>
                                      <span className="opacity-30 mr-2 text-[10px]">[{new Date().toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                                      {log.msg}
                                  </div>
                              ))
                          )}
                          <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}></div>
                      </div>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
};
