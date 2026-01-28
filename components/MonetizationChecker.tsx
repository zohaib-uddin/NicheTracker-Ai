
import React, { useState, useMemo } from 'react';
import { analyzeProfile } from '../services/geminiService';
import { NicheData, UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { 
    CheckCircle, XCircle, Loader2, DollarSign, MapPin, Users, 
    AlertTriangle, ShieldCheck, Zap, Activity, BrainCircuit, Target,
    BarChart2, Calendar, Repeat, Anchor, Lightbulb,
    Film, AlignLeft, Music, History, Lock, Heart, Clock, Layers, Users2, Video, TrendingUp, Globe
} from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { AdUnit } from './AdUnit';

interface MonetizationCheckerProps {
    user?: UserProfile | null;
    refreshProfile?: () => void;
    onConsumeCredit?: (type: 'ai' | 'monetization') => void; // New Prop
}

// ... (Helper components: CustomLegend, CustomTooltip, REGION_NAMES remain same) ...
const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-surface border border-border">
            <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: entry.color }}></div>
            <span style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface/95 border border-border p-4 rounded-xl shadow-2xl backdrop-blur-xl z-50">
                <p className="text-muted text-xs font-medium mb-2 uppercase tracking-wide border-b border-border pb-2">
                    {new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm font-bold mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-foreground min-w-[80px]">{entry.name}:</span>
                        <span style={{ color: entry.color }}>
                            {entry.value > 1000000 
                                ? `${(entry.value / 1000000).toFixed(2)}M` 
                                : entry.value > 1000 
                                    ? `${(entry.value / 1000).toFixed(1)}K` 
                                    : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const REGION_NAMES: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'UK': 'United Kingdom',
    'FR': 'France', 'DE': 'Germany', 'JP': 'Japan', 'KR': 'South Korea', 'BR': 'Brazil',
    'AU': 'Australia', 'CA': 'Canada', 'IT': 'Italy', 'ES': 'Spain',
    'NL': 'Netherlands', 'SE': 'Sweden', 'CH': 'Switzerland',
    'MX': 'Mexico', 'RU': 'Russia', 'ID': 'Indonesia', 'IN': 'India'
};

export const MonetizationChecker: React.FC<MonetizationCheckerProps> = ({ user, refreshProfile, onConsumeCredit }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<NicheData | null>(null);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'monthly' | 'lifetime'>('lifetime'); 

    // LIMITS LOGIC
    const isPro = !!user?.is_pro;
    const isAdmin = !!user?.is_admin; // Check admin status
    const limit = isPro ? 20 : 3; 
    const used = user?.usage?.monetization_checks_used || 0;
    const remaining = Math.max(0, limit - used);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isVideoLink = url.includes('/video/') || url.includes('/v/');
        if (!isVideoLink) {
            setError('Please enter a specific Video Link (e.g. tiktok.com/@user/video/12345).');
            return;
        }

        if (!isAdmin && remaining <= 0) {
            setError(isPro ? "Daily limit reached." : "Daily limit reached. Upgrade to Pro.");
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await analyzeProfile(url);
            setResult(data);

            // UPDATED: Use onConsumeCredit prop if available for realtime update
            if (!isAdmin) {
                if (onConsumeCredit) {
                    onConsumeCredit('monetization');
                } else if (refreshProfile && supabase && user) {
                    // Fallback to old method if prop missing (should not happen with new App.tsx)
                    const newUsage = { 
                        ...(user.usage || {}), 
                        monetization_checks_used: used + 1,
                        last_reset: user.usage?.last_reset || new Date().toDateString()
                    };
                    await supabase.auth.updateUser({ data: { usage: newUsage } });
                    try { await supabase.from('users').update({ usage: newUsage }).eq('id', user.id); } catch (e) {}
                    refreshProfile();
                }
            }
        } catch (err) {
            setError('Failed to fetch account data. Please check the link and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of the component logic remains identical) ...
    const status = useMemo(() => {
        if (!result) return null;
        
        const followers = result.author_stats?.followers || 0;
        let regionCode = result.region?.toUpperCase();
        if (!regionCode) regionCode = 'US';
        const isUnknown = regionCode === 'UNKNOWN';
        const regionName = REGION_NAMES[regionCode] || regionCode;
        const eligibleCountries = ['US', 'GB', 'UK', 'FR', 'DE', 'JP', 'KR', 'BR'];
        
        const isFollowersOk = followers >= 10000;
        const isRegionOk = eligibleCountries.includes(regionCode);
        const isEligible = isFollowersOk && isRegionOk;

        return { 
            isEligible, 
            isFollowersOk, 
            isRegionOk, 
            followers, 
            regionCode, 
            regionName: isUnknown ? "Region Not Detected" : regionName 
        };
    }, [result]);

    // ... (revenueMetrics logic same) ...
    const revenueMetrics = useMemo(() => {
        if (!result) return null;

        const metrics = result.niche_metrics;
        const deep = result.deep_analysis;
        
        // 1. DETERMINE REGION TIER (Impacts Standard RPM)
        const region = result.region?.toUpperCase() || 'US';
        let regionMultiplier = 0.5; // Tier 3 Default
        
        // Tier 1: Premium Ad Markets
        if (['US', 'UK', 'GB', 'AU', 'CA', 'DE', 'FR', 'KR', 'JP'].includes(region)) {
            regionMultiplier = 1.0;
        } 
        // Tier 2: Mid Markets
        else if (['IT', 'ES', 'NL', 'SE', 'CH', 'NO', 'DK', 'AE', 'SA', 'BR'].includes(region)) {
            regionMultiplier = 0.75;
        }

        // 2. DETERMINE CATEGORY BASE (Impacts Standard RPM)
        const catLower = (result.category || deep?.primary_niche || '').toLowerCase();
        const subCatLower = (deep?.sub_niche || '').toLowerCase();
        
        let baseCategoryRate = 0.30; // General Entertainment Default

        // High Value
        if (catLower.includes('finance') || catLower.includes('business') || catLower.includes('money') || subCatLower.includes('crypto') || subCatLower.includes('invest')) {
            baseCategoryRate = 0.80;
        } else if (catLower.includes('tech') || catLower.includes('ai') || catLower.includes('real estate') || catLower.includes('insurance')) {
            baseCategoryRate = 0.65;
        } 
        // Mid Value
        else if (catLower.includes('education') || catLower.includes('health') || catLower.includes('fitness') || catLower.includes('car') || catLower.includes('auto')) {
            baseCategoryRate = 0.50;
        } 
        // Low Value
        else if (catLower.includes('comedy') || catLower.includes('meme') || catLower.includes('dance') || catLower.includes('prank') || catLower.includes('gaming')) {
            baseCategoryRate = 0.20;
        }

        // CALCULATE STANDARD RPM
        let calculatedStandardRpm = baseCategoryRate * regionMultiplier;
        calculatedStandardRpm = Math.max(0.05, Math.min(0.80, calculatedStandardRpm));

        // 3. DETERMINE PERFORMANCE BONUS (Additional Reward)
        const retentionScore = metrics?.retention_score || 50; 
        const engagementRate = metrics?.avg_niche_engagement || 5; 
        const searchVolume = metrics?.search_volume || "Medium";
        const followerCount = result.author_stats?.followers || 0;

        let performanceMultiplier = 0;

        if (retentionScore >= 80) performanceMultiplier += 0.60;
        else if (retentionScore >= 60) performanceMultiplier += 0.30;

        if (engagementRate >= 10) performanceMultiplier += 0.40;
        else if (engagementRate >= 5) performanceMultiplier += 0.20;

        if (searchVolume === 'High' || searchVolume === 'Explosive') performanceMultiplier += 0.30;
        if (followerCount > 100000) performanceMultiplier += 0.20;

        // Apply Region to Performance
        let calculatedAdditionalRpm = performanceMultiplier * regionMultiplier;
        calculatedAdditionalRpm = Math.max(0.00, Math.min(1.50, calculatedAdditionalRpm));

        const totalRpm = calculatedStandardRpm + calculatedAdditionalRpm;

        return {
            standardRpm: `$${calculatedStandardRpm.toFixed(2)}`,
            rawStandard: calculatedStandardRpm,
            
            additionalRpm: `$${calculatedAdditionalRpm.toFixed(2)}`,
            rawAdditional: calculatedAdditionalRpm,
            
            totalRpm: `$${totalRpm.toFixed(2)}`,
            rawTotal: totalRpm
        };
    }, [result]);

    const deepData = result?.deep_analysis;

    const getAccountAge = () => {
        if (!deepData?.account_age_days) return "Unknown";
        if (deepData.account_age_days > 365) return `${(deepData.account_age_days / 365).toFixed(1)} Years`;
        return `${deepData.account_age_days} Days`;
    };

    const getAccountCreationDate = () => {
        if (!deepData?.account_age_days) return "Unknown";
        const now = new Date();
        const creationDate = new Date(now.getTime() - (deepData.account_age_days * 24 * 60 * 60 * 1000));
        return creationDate.toLocaleDateString();
    };

    const chartData = useMemo(() => {
        const history = deepData?.growth_history || [];
        if (!history || history.length === 0) return [];

        if (viewMode === 'monthly') {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return history.filter(item => new Date(item.date) >= firstDayOfMonth);
        } else {
            return history; 
        }

    }, [deepData?.growth_history, viewMode]);

    const chartSummary = useMemo(() => {
        if (!chartData.length) return null;
        const lastPoint = chartData[chartData.length - 1];
        const totalViews = lastPoint ? lastPoint.views : 0;
        return { totalViews };
    }, [chartData]);

    const secretSauceCards = [
        { icon: Anchor, color: 'blue', title: 'The Hook', value: deepData?.hook_technique, desc: 'Visual/Audio Trigger' },
        { icon: Lightbulb, color: 'purple', title: 'Core Strategy', value: deepData?.winning_strategy, desc: 'Growth Engine' },
        { icon: Zap, color: 'green', title: 'The CTA', value: deepData?.call_to_action_type, desc: 'Conversion Method' },
        { icon: Music, color: 'pink', title: 'Audio Signature', value: deepData?.audio_signature, desc: 'Sonic Branding' },
        { icon: AlignLeft, color: 'yellow', title: 'Caption SEO', value: deepData?.caption_seo_strategy, desc: 'Keyword Logic' },
        { icon: Film, color: 'red', title: 'Editing Pacing', value: deepData?.editing_pacing, desc: 'Visual Rhythm' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-yellow-500/10 rounded-2xl mb-4 shadow-lg shadow-yellow-500/20 border border-yellow-500/20">
                    <DollarSign size={32} className="text-yellow-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Profile Intelligence</h1>
                <p className="text-muted max-w-lg mx-auto text-base md:text-lg">
                    Paste a <strong className="text-foreground">Video Link</strong> from the account to analyze the <strong className="text-green-500">account’s performance metrics</strong>.
                </p>
                
                {/* IMPROVED DAILY CREDITS DISPLAY */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${remaining > 0 || isAdmin ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <Zap size={16} className={(remaining > 0 || isAdmin) ? "fill-green-500 text-green-500" : "text-red-500"} />
                        <span className="font-bold text-lg">{isAdmin ? "UNLIMITED" : `${remaining} / ${limit}`}</span>
                        <span className="text-xs opacity-80 font-medium uppercase tracking-wide">Daily Checks Left</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-muted flex items-center gap-1.5 shadow-sm">
                        <Clock size={14} />
                        Resets Daily 00:00
                    </div>
                </div>
            </div>

            {/* AD PLACEMENT: BEFORE INPUT */}
            <AdUnit slot="monetization-top-slot" format="horizontal" />

            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <form onSubmit={handleCheck} className="relative z-10 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Video className="absolute left-4 top-4 text-muted w-5 h-5 group-focus-within:text-yellow-400 transition-colors" />
                        <input 
                            type="text" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. https://www.tiktok.com/@khaby.lame/video/73..." 
                            className="w-full bg-background dark:bg-black/50 border border-border rounded-xl py-4 pl-12 pr-4 text-foreground dark:text-white placeholder-muted focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-base md:text-lg font-mono"
                            disabled={loading || (!isAdmin && remaining <= 0)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !url || (!isAdmin && remaining <= 0)}
                        className={`px-8 py-4 rounded-xl font-bold text-black flex items-center justify-center gap-2 transition-all ${
                            loading || !url || (!isAdmin && remaining <= 0)
                            ? 'bg-gray-500 cursor-not-allowed text-gray-800' 
                            : 'bg-yellow-400 hover:bg-yellow-300 hover:scale-[1.02] shadow-lg shadow-yellow-400/20'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                        {loading ? 'Scanning...' : ((!isAdmin && remaining <= 0) ? (isPro ? 'Limit Reached' : 'Upgrade') : 'Audit Account')}
                    </button>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}
            </div>

            {/* ... Rest of JSX same as provided ... */}
            {status && result && (
                <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
                    {/* ... (rest of the visualization JSX) ... */}
                    {/* Just returning the existing visualization code block here to complete the component */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`col-span-1 lg:col-span-2 p-6 md:p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden ${
                            status.isEligible 
                                ? 'bg-gradient-to-r from-green-500/10 to-transparent border-green-500/50' 
                                : 'bg-gradient-to-r from-red-500/10 to-transparent border-red-500/50'
                        }`}>
                            <div className="relative z-10 w-full">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                                    {status.isEligible ? 'PROGRAM ELIGIBLE' : 'NOT ELIGIBLE'}
                                    {status.isEligible 
                                        ? <CheckCircle className="text-green-500" size={32}/> 
                                        : <XCircle className="text-red-500" size={32}/>
                                    }
                                </h2>
                                <p className={`text-sm font-medium ${status.isEligible ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                                    {status.isEligible 
                                        ? 'Account meets Region & 10k+ Followers requirement.' 
                                        : 'Account misses key requirements (Followers or Region).'}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-4">
                                     <div className={`px-3 py-1.5 rounded-lg bg-surface/50 border ${status.isRegionOk ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'} text-sm font-mono flex items-center gap-2`}>
                                        <MapPin size={14}/> {status.regionName}
                                     </div>
                                     <div className={`px-3 py-1.5 rounded-lg bg-surface/50 border ${status.isFollowersOk ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'} text-sm font-mono flex items-center gap-2`}>
                                        <Users size={14}/> {status.followers.toLocaleString()} Followers
                                     </div>
                                </div>
                            </div>
                            <img 
                                src={result.channel_avatar_url} 
                                className="w-24 h-24 rounded-full border-4 border-surface shadow-xl hidden md:block mt-4 md:mt-0" 
                                alt="avatar"
                            />
                        </div>

                        <div className="col-span-1 bg-surface border border-border p-6 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-lg">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="text-purple-400" size={20} />
                                    <h3 className="text-lg font-bold text-foreground">Content Identity</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border">
                                        <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Primary Niche</div>
                                        <div className="text-base font-bold text-foreground">{result.deep_analysis?.primary_niche || "General"}</div>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border">
                                        <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Sub Niche</div>
                                        <div className="text-base font-bold text-blue-500">{result.deep_analysis?.sub_niche || "Variety"}</div>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border">
                                        <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Target Audience</div>
                                        <div className="text-sm font-medium text-foreground leading-snug">{result.deep_analysis?.targeted_audience || "General Audience"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AdUnit slot="monetization-profile-slot" format="horizontal" />

                    <div className="bg-[#121214] border border-blue-500/30 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-blue-900/10">
                        <div className="absolute top-0 right-0 p-24 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none"></div>
                        {!status.isEligible && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                                <Lock size={32} className="text-gray-500 mb-2" />
                                <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm">RPM Locked</h3>
                                <p className="text-xs text-gray-500 mt-1">Monetization criteria not met</p>
                            </div>
                        )}
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                                    <Zap className="text-yellow-400" size={24} />
                                    Estimated RPM Calculator
                                </h3>
                                <span className="mt-2 md:mt-0 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 font-bold font-mono">
Advanced AI Intelligence                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col gap-2">
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Standard Reward RPM</div>
                                    <div className="text-2xl md:text-3xl font-mono font-bold text-white">{revenueMetrics?.standardRpm}</div>
                                </div>
                                <div className="bg-yellow-500/10 rounded-2xl p-5 border border-yellow-500/10 flex flex-col gap-2">
                                    <div className="text-xs text-yellow-500/80 font-bold uppercase tracking-wider">Additional Reward RPM</div>
                                    <div className="text-2xl md:text-3xl font-mono font-bold text-yellow-400">{revenueMetrics?.additionalRpm}</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-900/20 rounded-2xl p-5 border border-green-500/30 flex flex-col gap-2 relative overflow-hidden">
                                    <div className="text-xs text-green-400 font-bold uppercase tracking-wider relative z-10">Total Estimated RPM</div>
                                    <div className="text-3xl md:text-4xl font-mono font-black text-green-400 tracking-tight relative z-10">{revenueMetrics?.totalRpm}</div>
                                    <Zap className="absolute -right-4 -bottom-4 text-green-500/10" size={80} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <AdUnit slot="monetization-rpm-slot" format="horizontal" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-surface border border-border p-5 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
                             <div className="flex items-center justify-between mb-4">
                                 <div className="p-2 bg-purple-500/10 rounded-lg"><Repeat className="text-purple-400" size={18} /></div>
                                 <div className="text-xs text-muted uppercase tracking-wider font-bold">Upload Frequency</div>
                             </div>
                             <div className="flex items-baseline justify-between mb-3">
                                 <div className="flex flex-col">
                                     <span className="text-2xl font-black text-foreground">{deepData?.daily_post_frequency || 0}</span>
                                     <span className="text-[10px] text-muted uppercase font-bold">/ Day</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <span className="text-2xl font-black text-purple-400">{deepData?.weekly_upload_rate || 0}</span>
                                     <span className="text-[10px] text-muted uppercase font-bold">/ Week</span>
                                 </div>
                             </div>
                             <div className="space-y-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-purple-500 h-full transition-all duration-1000 ease-out" 
                                        style={{width: `${Math.min((deepData?.consistency_score || 0), 100)}%`}}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                                    <span className="text-purple-500">Uploading Ratio</span>
                                    <span className="text-foreground">{deepData?.consistency_score || 0}%</span>
                                </div>
                             </div>
                        </div>
                        <div className="bg-surface border border-border p-5 rounded-2xl">
                             <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="text-blue-400" size={18} /></div>
                                <span className="text-xs text-muted">History</span>
                             </div>
                             <div className="text-2xl font-bold text-foreground">{getAccountAge()}</div>
                             <div className="mt-3 text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded inline-block">
                                Created: {getAccountCreationDate()}
                             </div>
                        </div>
                        <div className="bg-surface border border-border p-5 rounded-2xl">
                             <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-pink-500/10 rounded-lg"><Activity className="text-pink-400" size={18} /></div>
                                <span className="text-xs text-muted">Content</span>
                             </div>
                             <div className="text-2xl font-bold text-foreground">{result.author_stats?.videos.toLocaleString() || 0}</div>
                             <div className="text-xs text-muted mt-1">Total Videos</div>
                        </div>
                        <div className="bg-surface border border-border p-5 rounded-2xl">
                             <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg"><Heart className="text-red-400" size={18} /></div>
                                <span className="text-xs text-muted">Likes</span>
                             </div>
                             <div className="text-2xl font-bold text-foreground">{(result.author_stats?.hearts || 0).toLocaleString()}</div>
                             <div className="text-xs text-muted mt-1">Total Account Likes</div>
                        </div>
                    </div>

                    <AdUnit slot="monetization-grid-slot" format="horizontal" />

                    <div className="bg-surface border border-border rounded-3xl p-6 h-[400px] md:h-[550px] flex flex-col relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <BarChart2 className="text-green-500" size={20} />
                                Growth Trajectory
                            </h3>
                            <div className="bg-surface p-1 rounded-lg border border-border flex items-center">
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                                        viewMode === 'monthly' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'
                                    }`}
                                >
                                    <Calendar size={12} />
                                    This Month
                                </button>
                                <button
                                    onClick={() => setViewMode('lifetime')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                                        viewMode === 'lifetime' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'
                                    }`}
                                >
                                    <History size={12} />
                                    Lifetime
                                </button>
                            </div>
                        </div>
                        {chartData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" stroke="var(--muted)" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} tickFormatter={(date) => {
                                            const d = new Date(date);
                                            if (viewMode === 'lifetime') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                                            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} label={{ value: 'Followers', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 10 }} domain={['auto', 'auto']}/>
                                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} label={{ value: 'Total Views', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }} domain={['auto', 'auto']}/>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend content={CustomLegend} />
                                    <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Followers"/>
                                    <Line yAxisId="right" type="monotone" dataKey="views" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Total Account Views" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted gap-4">
                                <Clock size={48} className="text-muted" />
                                <p>Insufficient data points for {viewMode} trajectory.</p>
                            </div>
                        )}
                        {chartSummary && (
                            <div className="absolute top-20 right-6 flex flex-col gap-2 pointer-events-none z-10 hidden sm:flex">
                                <div className="px-3 py-1 bg-surface/80 backdrop-blur rounded-lg border border-border flex items-center gap-2 shadow-xl">
                                    <span className="text-xs text-muted uppercase">
                                        {viewMode === 'monthly' ? 'Total Views (Current Month)' : 'Total Account Views'}
                                    </span>
                                    <div className="flex items-center text-sm font-bold text-foreground">
                                        {chartSummary.totalViews >= 1000000 ? `${(chartSummary.totalViews / 1000000).toFixed(2)}M` : `${(chartSummary.totalViews / 1000).toFixed(1)}K`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <AdUnit slot="monetization-bottom-slot" format="horizontal" />

                    <div className="bg-[#121214] border border-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <BrainCircuit className="text-blue-400" />
                            Secret Sauce Declassified (AI Analysis)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            {secretSauceCards.map((card, idx) => (
                                <div key={idx} className={`bg-surface/10 p-6 rounded-2xl border border-white/5 hover:border-${card.color}-500/30 transition-colors group flex flex-col h-full hover:bg-white/5`}>
                                    <div className={`text-xs text-${card.color}-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-white/5 pb-2`}>
                                        <card.icon size={14} /> {card.title}
                                    </div>
                                    <p className="text-gray-200 text-sm font-medium leading-relaxed mb-4 flex-grow">
                                        "{card.value || 'Analyzing strategy...'}"
                                    </p>
                                    <div className="mt-auto pt-2 border-t border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
