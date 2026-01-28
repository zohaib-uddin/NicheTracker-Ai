
import React, { useState } from 'react';
import { AdminPanelProps, NicheData } from '../types';
import { Plus, Link, Youtube, Video, CheckCircle, AlertCircle, Loader2, Sparkles, Save, X, Users, Globe, Calendar, Tag } from 'lucide-react';
import { analyzeVideoUrl } from '../services/geminiService';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onAddNiche }) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  // Staging state for manual review before adding
  const [reviewData, setReviewData] = useState<NicheData | null>(null);

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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReviewData(null);

    if (!url) {
      setError('Please enter a valid URL');
      return;
    }

    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTiktok = url.includes('tiktok.com');

    if (!isYoutube && !isTiktok) {
      setError('Please provide a valid TikTok or YouTube URL');
      return;
    }

    setIsAnalyzing(true);

    try {
      const nicheData = await analyzeVideoUrl(url);
      setReviewData(nicheData);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze video. Please check the URL and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFieldChange = (field: keyof NicheData, value: any) => {
    if (reviewData) {
      setReviewData({ ...reviewData, [field]: value });
    }
  };

  const handleEngagementChange = (field: 'likes' | 'comments' | 'shares', value: string) => {
    if (reviewData) {
      setReviewData({
        ...reviewData,
        engagement: { ...reviewData.engagement, [field]: value }
      });
    }
  };

  const handleAuthorStatsChange = (field: 'followers', value: string) => {
    if (reviewData) {
        const numValue = parseInt(value.replace(/,/g, '')) || 0;
        setReviewData({
            ...reviewData,
            author_stats: {
                ...reviewData.author_stats!,
                [field]: numValue
            }
        });
    }
  };

  const handleSaveToDashboard = () => {
    if (reviewData) {
      onAddNiche(reviewData);
      setReviewData(null);
      setUrl('');
      // Trigger a small browser alert or toast logic could go here, 
      // but App.tsx switches view immediately, so it's fine.
    }
  };

  const formatReviewDate = (ts?: number) => {
    if(!ts) return "Unknown";
    return new Date(ts * 1000).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted mt-2">
          Add videos to your tracking dashboard. Select the <strong>Category</strong> below to ensure it appears in the correct feed.
        </p>
      </div>

      {/* STEP 1: INPUT URL */}
      {!reviewData && (
        <div className="bg-surface border border-border rounded-xl p-8 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-colors duration-300">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border relative z-10">
            <div className="p-3 bg-gradient-to-br from-primary to-purple-600 rounded-lg shadow-lg shadow-primary/20">
                <Sparkles className="text-white" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-foreground">1. Analyze Video</h2>
                <p className="text-sm text-muted">Paste a link to fetch Metadata & AI Stats.</p>
            </div>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-6 relative z-10">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted">Video Link</label>
                <div className="relative group">
                <Link className="absolute left-3 top-3.5 text-muted w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..." 
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    disabled={isAnalyzing}
                />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
                </div>
            )}

            <button 
                type="submit"
                disabled={isAnalyzing || !url}
                className={`w-full flex items-center justify-center gap-2 bg-foreground text-background font-bold py-3.5 rounded-xl shadow-lg transition-all ${
                isAnalyzing || !url ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]'
                }`}
            >
                {isAnalyzing ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    Checking Real Stats...
                </>
                ) : (
                <>
                    <Sparkles size={20} />
                    Analyze Video
                </>
                )}
            </button>
            </form>
        </div>
      )}

      {/* STEP 2: REVIEW & EDIT */}
      {reviewData && (
        <div className="bg-surface border border-border rounded-xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-8 transition-colors duration-300">
             <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">2. Review & Categorize</h2>
                        <p className="text-sm text-muted">Assign the correct <strong>Category</strong> to send this video to the right feed.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setReviewData(null)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-muted hover:text-foreground"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Col: Metadata */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Metadata</h3>
                    
                    {/* CATEGORY SELECTOR - CRITICAL FOR FEED */}
                    <div>
                        <label className="text-xs text-blue-500 dark:text-blue-300 block mb-1 flex items-center gap-1 font-bold">
                            <Tag size={12} /> Target Category
                        </label>
                        <select 
                            value={reviewData.category}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            className="w-full bg-background border border-blue-500/50 rounded-lg p-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="General">Other</option>
                        </select>
                        <p className="text-[10px] text-muted mt-1">This determines which page the video appears on.</p>
                    </div>

                    <div>
                        <label className="text-xs text-muted block mb-1">Title</label>
                        <input 
                            type="text" 
                            value={reviewData.title} 
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted block mb-1">Channel Name</label>
                        <input 
                            type="text" 
                            value={reviewData.channel_name} 
                            onChange={(e) => handleFieldChange('channel_name', e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-border">
                            <label className="text-[10px] text-muted block mb-1 flex items-center gap-1"><Globe size={10}/> Region</label>
                            <div className="text-sm font-mono text-foreground">{reviewData.region || "N/A"}</div>
                        </div>
                         <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-border">
                            <label className="text-[10px] text-muted block mb-1 flex items-center gap-1"><Calendar size={10}/> Posted</label>
                            <div className="text-sm font-mono text-foreground">{formatReviewDate(reviewData.create_time)}</div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Stats */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-green-500 dark:text-green-400 uppercase tracking-wider">Account & Video Stats</h3>
                    
                    {/* FOLLOWERS INPUT - CRITICAL FOR MONETIZATION */}
                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border">
                        <label className="text-xs text-blue-500 dark:text-blue-300 block mb-1 flex items-center gap-1 font-bold">
                            <Users size={12} /> Account Followers (Real)
                        </label>
                        <input 
                            type="number" 
                            value={reviewData.author_stats?.followers || 0} 
                            onChange={(e) => handleAuthorStatsChange('followers', e.target.value)}
                            className={`w-full bg-background border rounded-lg p-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none font-mono font-bold ${(!reviewData.author_stats?.followers || reviewData.author_stats.followers < 10000) ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-green-500 text-green-600 dark:text-green-400'}`}
                            placeholder="Must be > 10,000 for monetization"
                        />
                        <div className="text-[10px] mt-1 text-right">
                             {(!reviewData.author_stats?.followers || reviewData.author_stats.followers < 10000) ? 
                                <span className="text-red-500">Not Eligible for Monetization</span> : 
                                <span className="text-green-500">Eligible (10k+ Met)</span>
                             }
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-muted block mb-1">Video Views</label>
                        <input 
                            type="text" 
                            value={reviewData.views} 
                            onChange={(e) => handleFieldChange('views', e.target.value)}
                            className={`w-full bg-background border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${reviewData.views === 'N/A' ? 'border-red-500/50 text-red-500' : 'border-border'}`}
                            placeholder="e.g. 1.2M"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                         <div>
                            <label className="text-xs text-muted block mb-1">Likes</label>
                            <input 
                                type="text" 
                                value={reviewData.engagement.likes} 
                                onChange={(e) => handleEngagementChange('likes', e.target.value)}
                                className={`w-full bg-background border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${reviewData.engagement.likes === 'N/A' ? 'border-red-500/50 text-red-500' : 'border-border'}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Comments</label>
                            <input 
                                type="text" 
                                value={reviewData.engagement.comments} 
                                onChange={(e) => handleEngagementChange('comments', e.target.value)}
                                className={`w-full bg-background border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${reviewData.engagement.comments === 'N/A' ? 'border-red-500/50 text-red-500' : 'border-border'}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted block mb-1">Shares</label>
                            <input 
                                type="text" 
                                value={reviewData.engagement.shares} 
                                onChange={(e) => handleEngagementChange('shares', e.target.value)}
                                className={`w-full bg-background border rounded-lg p-2.5 text-sm text-foreground focus:border-primary focus:outline-none ${reviewData.engagement.shares === 'N/A' ? 'border-red-500/50 text-red-500' : 'border-border'}`}
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-8 flex gap-3">
                <button 
                    onClick={() => setReviewData(null)}
                    className="flex-1 py-3 bg-surface border border-border text-foreground rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    Discard
                </button>
                <button 
                    onClick={handleSaveToDashboard}
                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                    <Save size={18} />
                    Confirm & Save to Dashboard
                </button>
            </div>
        </div>
      )}

      {/* Info Section */}
      {!reviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted text-sm">
            <div className="bg-surface/50 p-4 rounded-xl border border-border">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Youtube size={16} className="text-red-500" /> YouTube Support</h4>
            <p>Paste the full URL or share link. Our AI will grab the thumbnail and title automatically.</p>
            </div>
            <div className="bg-surface/50 p-4 rounded-xl border border-border">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Video size={16} className="text-pink-500" />
                    TikTok Support
                </h4>
            <p>Paste the direct video link. We will check the account's followers automatically for monetization status.</p>
            </div>
        </div>
      )}
    </div>
  );
};
