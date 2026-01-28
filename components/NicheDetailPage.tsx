
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { NicheData, AiContentIdea, UserProfile } from '../types';
import { fetchVideoStatsOnly, getCachedData, updateCache, generateContentIdeas, analyzeVideoUrl } from '../services/geminiService';
import { NicheCard } from './NicheCard'; // Import NicheCard
import { supabase } from '../services/supabaseClient';
import { UnlockModal } from './UnlockModal';
import { AdUnit } from './AdUnit'; // Import AdUnit
import { 
  ArrowLeft, 
  CheckCircle, 
  DollarSign, 
  BarChart2, 
  Share2, 
  Heart, 
  MessageCircle, 
  Activity,
  Users,
  Lock,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  Target,
  Zap,
  Gauge,
  Search,
  BatteryWarning,
  Flame,
  MousePointer2,
  Anchor,
  Coins,
  ShieldAlert,
  Hash,
  User,
  Tags,
  Flag,
  Scan,
  Binary,
  Cpu,
  Fingerprint,
  Radar,
  BrainCircuit,
  Lightbulb,
  Wrench,
  FileText,
  Layers,
  TrendingUp,
  Globe,
  RefreshCw,
  Play,
  Wand2,
  Clapperboard,
  Sparkles,
  Bookmark,
  Check,
  Microchip,
  Clock,
  Loader2,
  Music,
  AlignLeft,
  Film
} from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

interface NicheDetailPageProps {
  niche: NicheData;
  allNiches?: NicheData[]; // New prop for related videos logic
  onBack: () => void;
  user?: UserProfile | null;
  refreshProfile?: () => void;
  onTrackNiche?: () => void; // Added Prop
  savedIds?: string[];
  onToggleSave?: (id: string, data: NicheData) => void;
  onDelete?: (id: string) => void; // Added Prop
  onConsumeCredit?: (type: 'ai' | 'monetization') => void;
}

// --- HELPER COMPONENTS ---

const TechSeparator = () => (
    <div className="flex items-center gap-1 opacity-20 my-2">
        <div className="h-1 w-1 rounded-full bg-blue-400"></div>
        <div className="h-px flex-1 bg-gradient-to-r from-blue-400/0 via-blue-400 to-blue-400/0"></div>
        <div className="h-1 w-1 rounded-full bg-blue-400"></div>
    </div>
);

// Advanced Gauge Bar Component
const GaugeBar = ({ label, value, color, icon: Icon, subLabel }: any) => (
    <div className="relative group p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all">
        <div className="flex justify-between text-xs mb-3">
            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2 font-bold group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                <Icon size={14} className={color.replace('bg-', 'text-').replace('from-', 'text-').replace('to-', '')}/> 
                {label}
            </span>
            <div className="text-right">
                <span className="text-gray-900 dark:text-white font-mono font-black text-sm block">{value}%</span>
            </div>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-black/50 border border-gray-300 dark:border-white/5 rounded-full overflow-hidden relative">
            <div className={`h-full ${color} rounded-full relative transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}>
                <div className="absolute top-0 right-0 bottom-0 w-px bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
            </div>
             {/* Grid lines on bar */}
            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
        </div>
        {subLabel && <div className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wide">{subLabel}</div>}
    </div>
);

// --- NEW HELPER: COMPACT FORMATTER (K/M) ---
const formatCompact = (val: string | number | undefined) => {
    if (val === undefined || val === null) return "0";
    
    // Convert to number if string
    let num: number;
    if (typeof val === 'number') {
        num = val;
    } else {
        // Clean non-numeric characters except '.'
        const clean = val.toString().replace(/,/g, '');
        // Check if already formatted
        if (clean.toUpperCase().includes('M')) return clean; 
        if (clean.toUpperCase().includes('K')) return clean;
        num = parseFloat(clean);
    }
    
    if (isNaN(num)) return "0";

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
};


export const NicheDetailPage: React.FC<NicheDetailPageProps> = ({ 
    niche: initialNiche, onBack, allNiches = [], user, refreshProfile, onTrackNiche, onConsumeCredit,
    savedIds = [], onToggleSave, onDelete
}) => {
  const [niche, setNiche] = useState<NicheData>(initialNiche);
  const isTikTok = niche.video_platform === 'TikTok';
  const [scanActive, setScanActive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // New State for Deep Analysis Refresh
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState(false);

  // Use passed props to determine save status
  const isSaved = savedIds.includes(niche.id);

  // --- STATE FOR AI GENERATION ---
  const [aiIdeas, setAiIdeas] = useState<AiContentIdea[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // --- LIMITS LOGIC ---
  const isPro = !!user?.is_pro;
  const isAdmin = !!user?.is_admin;
  const aiDailyLimit = 20; // 20 Ideas per day for Pro
  const aiUsed = user?.usage?.ai_analysis_used || 0;
  const aiRemaining = Math.max(0, aiDailyLimit - aiUsed);

  // --- TRIGGER TRACKING ON MOUNT ---
  useEffect(() => {
      if (onTrackNiche) {
          onTrackNiche();
      }
  }, []); // Run once on mount

  // --- STATE FOR REAL-TIME METRICS ---
  const cached = niche.video_id ? getCachedData(niche.video_id) : null;
  const initialStats = cached ? {
      views: cached.views,
      likes: cached.engagement.likes,
      comments: cached.engagement.comments,
      shares: cached.engagement.shares,
      followers: cached.author_stats?.followers, 
      lastUpdated: new Date(),
      video_url: (cached as any).video_url,
      cover_url: cached.cover_url,
      channel_avatar_url: cached.channel_avatar_url, 
      author_bio: cached.author_bio
  } : {
      views: niche.views,
      likes: niche.engagement.likes,
      comments: niche.engagement.comments,
      shares: niche.engagement.shares,
      followers: niche.author_stats?.followers,
      lastUpdated: new Date(),
      video_url: (niche as any).video_url,
      cover_url: niche.cover_url,
      channel_avatar_url: niche.channel_avatar_url,
      author_bio: niche.author_bio
  };

  const [liveMetrics, setLiveMetrics] = useState(initialStats);

  // --- SAVE HANDLER (For Big Button on Detail Page) ---
  const handleSaveToggle = () => {
      if (onToggleSave) {
          onToggleSave(niche.id, niche);
      }
  };

  // --- WATCH HANDLER ---
  const handleWatchExternal = () => {
      const url = isTikTok 
        ? `https://www.tiktok.com/@${niche.channel_handle?.replace('@','')}/video/${niche.video_id}`
        : `https://www.youtube.com/watch?v=${niche.video_id}`;
      window.open(url, '_blank');
  };

  // --- REFRESH AI ANALYSIS (Gemini) ---
  const handleRefreshAnalysis = async () => {
      if (!isPro && !isAdmin) {
          setShowUnlockModal(true);
          return;
      }
      
      const videoUrl = isTikTok 
        ? `https://www.tiktok.com/@${niche.channel_handle?.replace('@','')}/video/${niche.video_id}`
        : `https://www.youtube.com/watch?v=${niche.video_id}`;

      setIsRefreshingAnalysis(true);
      try {
          // Use the same analyze service as AddVideoPage to get Primary/Sub Niche
          const freshData = await analyzeVideoUrl(videoUrl);
          
          // Merge relevant AI fields into current niche state
          const updatedNiche = {
              ...niche,
              category: freshData.category || niche.category,
              title: freshData.title || niche.title,
              description: freshData.description || niche.description,
              deep_analysis: {
                  ...niche.deep_analysis,
                  ...freshData.deep_analysis // Overwrite with fresh AI insights
              },
              niche_metrics: {
                  ...niche.niche_metrics,
                  ...freshData.niche_metrics // Overwrite with fresh AI metrics
              }
          };
          
          setNiche(updatedNiche);
          // Also update cache/DB if needed (simplified here to local state)
          if(niche.video_id) updateCache(niche.video_id, updatedNiche);

      } catch (e) {
          console.error("AI Analysis Refresh Failed:", e);
      } finally {
          setIsRefreshingAnalysis(false);
      }
  };

  // --- EFFECT: REAL-TIME SYNC ---
  useEffect(() => {
    let intervalId: any;

    const fetchRealtimeData = async () => {
        if (!niche.video_id || !niche.channel_handle || !isTikTok) return;
        
        setIsSyncing(true);
        try {
            const videoUrl = `https://www.tiktok.com/@${niche.channel_handle.replace('@', '')}/video/${niche.video_id}`;
            const freshStats = await fetchVideoStatsOnly(videoUrl);
            
            if (freshStats) {
                const fullUpdatedData = { ...niche, ...freshStats };
                if (niche.video_id) updateCache(niche.video_id, fullUpdatedData as any);

                setLiveMetrics({
                    views: freshStats.views || "0",
                    likes: freshStats.engagement?.likes || "0",
                    comments: freshStats.engagement?.comments || "0",
                    shares: freshStats.engagement?.shares || "0",
                    followers: freshStats.author_stats?.followers || 0,
                    lastUpdated: new Date(),
                    video_url: (freshStats as any).video_url || liveMetrics.video_url,
                    cover_url: freshStats.cover_url || liveMetrics.cover_url,
                    channel_avatar_url: freshStats.channel_avatar_url || liveMetrics.channel_avatar_url, // Update Avatar
                    author_bio: freshStats.author_bio || liveMetrics.author_bio // Update Bio
                });
            }
        } catch (e) {
            console.warn("Auto-sync failed, using cached data", e);
        } finally {
            setIsSyncing(false);
            setScanActive(false);
        }
    };

    fetchRealtimeData();
    intervalId = setInterval(fetchRealtimeData, 60000); 

    return () => clearInterval(intervalId);
  }, [niche.id]); // Changed dependency to ID to ensure stable re-runs


  // --- REAL MONETIZATION & NICHE CALCULATOR LOGIC ---
  const stats = useMemo(() => {
    const parseCount = (val: string | number | undefined) => {
        if (val === undefined || val === null || val === 'N/A') return 0;
        const str = val.toString();
        const s = str.toUpperCase().replace(/,/g, '');
        if(s.includes('M')) return parseFloat(s) * 1000000;
        if(s.includes('K')) return parseFloat(s) * 1000;
        return parseFloat(s) || 0;
    };

    // USE LIVE METRICS FOR CALCULATIONS
    const views = parseCount(liveMetrics.views);
    const likes = parseCount(liveMetrics.likes);
    const comments = parseCount(liveMetrics.comments);
    const shares = parseCount(liveMetrics.shares);
    
    // Followers from Live Metrics if available (fallback to niche data)
    const followers = liveMetrics.followers !== undefined ? liveMetrics.followers : (niche.author_stats?.followers || 0);
    const hasEnoughFollowers = followers >= 10000; 
    
    const durationSeconds = niche.duration || 0;
    const isVideoEligible = durationSeconds >= 60;

    const eligibleCountries = ['US', 'GB', 'UK', 'FR', 'DE', 'JP', 'KR', 'BR'];
    const regionCode = niche.region ? niche.region.toUpperCase() : 'UNKNOWN';
    const isRegionEligible = eligibleCountries.includes(regionCode);

    const isFullyMonetized = hasEnoughFollowers && isVideoEligible && isRegionEligible;

    const rawQualifiedViews = Math.floor(views * 0.50);
    
    // --- ADVANCED STANDARD RPM LOGIC (Category + Region) ---
    // Strict separation to avoid generic $0.25 values.
    
    // 1. REFINED REGION TIERS
    let regionMultiplier = 0.3; // Tier 4 (Rest of World)
    
    const tier1 = ['US', 'GB', 'UK', 'AU', 'CA', 'DE', 'FR', 'CH', 'NO', 'SE']; // 100% (Western/Wealthy)
    const tier2 = ['JP', 'KR', 'IT', 'ES', 'NL', 'BE', 'DK', 'FI', 'AT', 'NZ', 'IE', 'AE', 'SA', 'QA', 'KW']; // 70% (Rich Asia/ME/EU)
    const tier3 = ['BR', 'MX', 'RU', 'TR', 'PL', 'PT', 'GR', 'CZ', 'ZA', 'CL']; // 50% (Developing)

    if (tier1.includes(regionCode)) regionMultiplier = 1.0;
    else if (tier2.includes(regionCode)) regionMultiplier = 0.7;
    else if (tier3.includes(regionCode)) regionMultiplier = 0.5;

    // 2. REFINED CATEGORY BASE RATES (5 Tiers)
    // Construct a mega-string to check against all available metadata for best match
    const catText = `${niche.category || ''} ${niche.deep_analysis?.primary_niche || ''} ${niche.deep_analysis?.sub_niche || ''} ${niche.title || ''}`.toLowerCase();
    
    let baseRate = 0.10; // Tier 5 (Default/Mass)

    // Tier 1: Elite ($0.45 Base)
    if (/(finance|business|crypto|invest|money|wealth|stock|real estate|insurance|law|attorney|saas|b2b|entrepreneur)/.test(catText)) {
        baseRate = 0.45;
    }
    // Tier 2: Premium ($0.35 Base)
    else if (/(tech|ai|software|coding|health|medical|doctor|fitness|gym|workout|car|auto|automotive|luxury|yacht|program)/.test(catText)) {
        baseRate = 0.35;
    }
    // Tier 3: Standard ($0.25 Base)
    else if (/(education|history|facts|trivia|geo|map|travel|cooking|food|recipe|diy|craft|home|motivation|mindset|psychology|science|nature)/.test(catText)) {
        baseRate = 0.25;
    }
    // Tier 4: Entertainment ($0.15 Base)
    else if (/(story|stories|mystery|horror|crime|scary|sport|football|soccer|basketball|baseball|fashion|beauty|makeup|hair|satisfying|asmr|art|drawing)/.test(catText)) {
        baseRate = 0.15;
    }
    // Tier 5: Mass Appeal ($0.10 Base)
    else {
        // Gaming, Comedy, Pranks, Memes, Dance, Music, Vlog fall here
        baseRate = 0.10;
    }

    // 3. CALCULATION
    let standardRpm = baseRate * regionMultiplier;
    
    // 4. STRICT CLAMP (0.01 - 0.45)
    // Ensure we don't go below a penny if eligible, but also respect the 0.45 hard cap requested.
    standardRpm = Math.max(0.01, Math.min(0.45, standardRpm));
    
    // --- END STANDARD RPM LOGIC ---

    // --- ADDITIONAL RPM LOGIC (UNCHANGED) ---
    let additionalRpm = 0.0;
    const totalEngagement = likes + comments + shares;
    const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;
    
    if (isFullyMonetized) {
        additionalRpm = 0.40; 
        if (engagementRate >= 1.0) additionalRpm += 0.20;
        if (engagementRate >= 3.0) additionalRpm += 0.20;
        if (engagementRate >= 6.0) additionalRpm += 0.20;
        if (engagementRate >= 10.0) additionalRpm += 0.20;
        if (additionalRpm > 1.50) additionalRpm = 1.50;
    }

    // --- REVENUE CALCULATION WITH 1K THRESHOLD ---
    let rawStandardRevenue = 0;
    let rawAdditionalRevenue = 0;

    // Only calculate revenue if qualified views exceed 1000
    if (rawQualifiedViews >= 1000) {
        rawStandardRevenue = (rawQualifiedViews / 1000) * standardRpm;
        rawAdditionalRevenue = (rawQualifiedViews / 1000) * additionalRpm;
    }

    const rawTotalEarnings = rawStandardRevenue + rawAdditionalRevenue;
    
    const effectiveTotalRpm = (rawQualifiedViews >= 1000) ? (rawTotalEarnings / (rawQualifiedViews / 1000)) : 0;

    const metrics = niche.niche_metrics || {} as any;
    
    const displayMoney = (val: number) => isFullyMonetized ? `$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "N/A";
    const displayNumber = (val: number) => isFullyMonetized ? val.toLocaleString() : "N/A";
    const displayRpm = (val: number) => isFullyMonetized ? `$${val.toFixed(2)}` : "N/A";

    const formatDuration = (secs: number) => {
        if(!secs) return "Unknown";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    const postDate = niche.create_time 
        ? new Date(niche.create_time * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Unknown Date';

    let videoEngagementVerdict = "Passive";
    let engagementColor = "text-gray-400";
    
    if (engagementRate > 15) { videoEngagementVerdict = "Viral Outbreak"; engagementColor = "text-red-400"; }
    else if (engagementRate > 8) { videoEngagementVerdict = "Hyper-Active"; engagementColor = "text-purple-400"; }
    else if (engagementRate > 4) { videoEngagementVerdict = "High Engagement"; engagementColor = "text-green-400"; }
    else if (engagementRate > 1) { videoEngagementVerdict = "Solid"; engagementColor = "text-blue-300"; }
    else { videoEngagementVerdict = "Passive"; engagementColor = "text-blue-400"; }
    
    const regionMap: Record<string, string> = {
        'US': 'North America (USA)', 'GB': 'Europe (UK)', 'UK': 'Europe (UK)',
        'DE': 'Europe (Germany)', 'FR': 'Europe (France)', 'ES': 'Europe (Spain)',
        'IT': 'Europe (Italy)', 'JP': 'Asia (Japan)', 'KR': 'Asia (Korea)',
        'IN': 'Asia (India)', 'ID': 'Asia (Indonesia)', 'VN': 'Asia (Vietnam)',
        'BR': 'S. America (Brazil)', 'MX': 'N. America (Mexico)',
        'AU': 'Oceania (Australia)', 'CA': 'N. America (Canada)',
        'RU': 'Eurasia (Russia)', 'SA': 'Middle East (KSA)'
    };
    
    const targetAudienceLabel = (metrics.target_country && metrics.target_country !== 'Global') 
        ? metrics.target_country 
        : (regionMap[regionCode] || `Global (${regionCode})`);


    return {
        views,
        followers,
        isAccountEligible: hasEnoughFollowers,
        isVideoEligible,
        isRegionEligible,
        isFullyMonetized,
        engagementRate: engagementRate.toFixed(2), // Export for UI
        durationStr: formatDuration(durationSeconds),
        postDate,
        region: regionCode,
        
        qualifiedViews: displayNumber(rawQualifiedViews),
        rpm: displayRpm(effectiveTotalRpm), 
        effectiveTotalRpm, 
        rawTotalEarnings,
        standardRpmVal: displayRpm(standardRpm),
        additionalRpmVal: displayRpm(additionalRpm),
        standardReward: displayMoney(rawStandardRevenue),
        additionalReward: displayMoney(rawAdditionalRevenue),
        totalRevenue: displayMoney(rawTotalEarnings),
        chartRevenue: isFullyMonetized ? rawTotalEarnings : 0,

        // AI METRICS
        velocity: metrics.trend_velocity || 0,
        algoScore: metrics.algo_score || 0,
        audPower: metrics.audience_power || 0,
        viralPot: metrics.viral_potential || 0,
        retention: metrics.retention_score || 0,
        moneyRating: metrics.monetization_rating || 0,
        successProb: metrics.success_probability || 0,
        saturation: metrics.saturation_percentage || 0,

        verdict: metrics.verdict || "AI Analyzing...",
        targetAudience: targetAudienceLabel,
        videoEngagement: videoEngagementVerdict, 
        engagementColor,
        compRatio: metrics.competitor_ratio || "Calculating...",
        longevity: metrics.trend_longevity || "Analyzing...", 
        fatigue: metrics.content_fatigue || "Medium",
        searchVol: metrics.search_volume || "High",
        patternMatch: metrics.neural_pattern_match || "Detecting...",
        matchConfidence: 94 
    };
  }, [niche, liveMetrics]);

  // --- DYNAMIC REVENUE GRAPH DATA ---
  const graphData = useMemo(() => {
      const now = new Date();
      const createDate = niche.create_time ? new Date(niche.create_time * 1000) : new Date(Date.now() - 7 * 86400 * 1000);
      const totalHours = Math.max(1, (now.getTime() - createDate.getTime()) / (1000 * 3600));
      const pointsCount = 10;
      const interval = totalHours / (pointsCount - 1);
      const dataPoints = [];
      const totalRevenue = stats.rawTotalEarnings;
      
      for (let i = 0; i < pointsCount; i++) {
          const pointTime = new Date(createDate.getTime() + (i * interval * 3600 * 1000));
          const t = i / (pointsCount - 1);
          let curveFactor = (t * t * (3 - 2 * t));
          const fluctuation = Math.sin(t * Math.PI * 2) * 0.05; 
          curveFactor += fluctuation;
          curveFactor = Math.max(0, Math.min(1, curveFactor));
          if (i === 0) curveFactor = 0;
          if (i === pointsCount - 1) curveFactor = 1;

          const estimatedRevenue = totalRevenue * curveFactor;
          let label = '';
          if (totalHours < 48) {
              label = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
              label = pointTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
          if (i === pointsCount - 1) label = 'Now';

          dataPoints.push({
              name: label,
              revenue: parseFloat(estimatedRevenue.toFixed(2)),
              rawDate: pointTime
          });
      }
      return dataPoints;
  }, [niche.create_time, stats.rawTotalEarnings, stats.effectiveTotalRpm, liveMetrics.views]); 

  const handleOpenProfile = () => {
    if (niche.channel_handle) {
        window.open(`https://www.tiktok.com/@${niche.channel_handle}`, '_blank');
    } else {
        window.open(`https://www.tiktok.com/@${niche.channel_name}`, '_blank');
    }
  };

  const getFailureReason = () => {
      if (!stats.isRegionEligible) return `this account's region (${stats.region}) is not supported (US, UK, FR, DE, JP, KR, BR only).`;
      if (!stats.isAccountEligible) return "this account has fewer than 10,000 followers.";
      if (!stats.isVideoEligible) return "this video is under 60 seconds.";
      return "eligibility criteria not met.";
  };

  // Toggle Play Function
  const togglePlay = () => {
      if (videoRef.current) {
          if (isPlaying) {
              videoRef.current.pause();
              setIsPlaying(false);
          } else {
              videoRef.current.play();
              setIsPlaying(true);
          }
      }
  };

  const handleGenerateIdeas = async () => {
      // 1. CHECK SUBSCRIPTION
      if (!isPro && !isAdmin) {
          setShowUnlockModal(true);
          return;
      }

      // 2. CHECK DAILY LIMIT
      if (!isAdmin && aiRemaining <= 0) {
          alert("Daily AI limit reached. Please try again tomorrow.");
          return;
      }

      setIsGeneratingIdeas(true);
      try {
          const ideas = await generateContentIdeas(niche);
          setAiIdeas(ideas);

          // 3. DECREMENT CREDITS (INCREMENT USAGE) - UPDATED: Use onConsumeCredit first
          if (!isAdmin) {
              if (onConsumeCredit) {
                  onConsumeCredit('ai');
              } else if (supabase && user) {
                  // Fallback
                  const newUsage = { 
                      ...(user.usage || {}), 
                      ai_analysis_used: aiUsed + 1,
                      last_reset: user.usage?.last_reset || new Date().toDateString()
                  };
                  await supabase.auth.updateUser({ data: { usage: newUsage } });
                  try { await supabase.from('users').update({ usage: newUsage }).eq('id', user.id); } catch (e) {}
                  if (refreshProfile) refreshProfile();
              }
          }

      } catch(e) {
          console.error(e);
      } finally {
          setIsGeneratingIdeas(false);
      }
  };

  // --- RELATED VIDEOS LOGIC ---
  const relatedVideos = useMemo(() => {
      if (!allNiches || allNiches.length === 0) return [];
      
      // Filter by same category, exclude current video
      const candidates = allNiches.filter(n => 
          n.category === niche.category && n.id !== niche.id
      );
      
      // Shuffle and pick 2
      const shuffled = candidates.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 2);
  }, [niche, allNiches]);


  const deep = niche.deep_analysis;
  const cleanVideoUrl = liveMetrics.video_url || (niche as any).video_url;
  const coverUrl = liveMetrics.cover_url || niche.cover_url;
  // Use real-time data if available
  const realAvatarUrl = liveMetrics.channel_avatar_url || niche.channel_avatar_url;
  const realBio = liveMetrics.author_bio || niche.author_bio;

  const strategyCards = [
      { title: 'The Hook', value: deep?.hook_technique, icon: Anchor, theme: 'blue', desc: 'Visual/Audio Trigger' },
      { title: 'Core Strategy', value: deep?.winning_strategy, icon: Lightbulb, theme: 'yellow', desc: 'Growth Engine' },
      { title: 'Call to Action', value: deep?.call_to_action_type, icon: Zap, theme: 'green', desc: 'Conversion Method' },
      { title: 'Audio Signature', value: deep?.audio_signature, icon: Music, theme: 'pink', desc: 'Sonic Branding' },
      { title: 'Caption SEO', value: deep?.caption_seo_strategy, icon: AlignLeft, theme: 'purple', desc: 'Keyword Logic' },
      { title: 'Editing Pacing', value: deep?.editing_pacing, icon: Film, theme: 'red', desc: 'Visual Rhythm' },
  ];

  const getThemeClasses = (theme: string) => {
      switch(theme) {
          case 'blue': return 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-500/50';
          case 'yellow': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 hover:border-yellow-500/50';
          case 'green': return 'bg-green-500/10 border-green-500/30 text-green-400 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 hover:border-green-500/50';
          case 'pink': return 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 hover:border-pink-500/50';
          case 'purple': return 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:border-purple-500/50';
          case 'red': return 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 hover:border-red-500/50';
          default: return 'bg-white/5 border-white/10 text-gray-300';
      }
  };

  const cleanId = (niche.video_id || '').match(/(\d{15,25})/) ? niche.video_id : niche.video_id; 
  const embedUrl = isTikTok 
    ? `https://www.tiktok.com/embed/v2/${cleanId}?lang=en-US&embedFrom=oembed`
    : `https://www.youtube.com/embed/${cleanId}?autoplay=0&controls=1&modestbranding=1`;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* HEADER */}
      <div className="flex flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 flex-1">
            <button 
                onClick={onBack}
                className="p-2 mt-1 bg-surface border border-border rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
            >
                <ArrowLeft size={20} className="text-muted" />
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {niche.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-muted">
                        {/* TAGS */}
                        {niche.keywords && niche.keywords.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {niche.keywords.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 shrink-0">
                            <Calendar size={12} className="text-gray-500 dark:text-gray-400"/>
                            <span className="text-xs text-gray-600 dark:text-gray-300">Posted: {stats.postDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Total Payout Badge - Fixed to right corner */}
        <div className="flex flex-col items-end text-right shrink-0 bg-surface/50 p-2 rounded-xl border border-border/50">
             <div className="text-[10px] md:text-xs text-muted font-bold uppercase tracking-wider">Est. Payout</div>
             <div className={`text-lg md:text-2xl font-mono font-black ${stats.totalRevenue === "N/A" ? "text-gray-500 dark:text-gray-600" : "text-green-500 dark:text-green-400"}`}>
                {stats.totalRevenue}
             </div>
        </div>
      </div>

      {/* AD: TOP SLOT */}
      <AdUnit slot="niche-detail-top" format="horizontal" className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Video Player & Account */}
        <div className="space-y-6">
            
            {/* Embed Card */}
            <div className="bg-black border border-border rounded-2xl overflow-hidden relative shadow-2xl mx-auto w-full max-w-[340px] aspect-[9/16] cursor-pointer" onClick={togglePlay}>
                {isTikTok && cleanVideoUrl ? (
                    <>
                        <video 
                            ref={videoRef}
                            src={cleanVideoUrl}
                            className="w-full h-full object-cover"
                            poster={coverUrl}
                            playsInline
                            loop
                            {...{ referrerPolicy: "no-referrer" } as any}
                        />
                        {/* Play Button Overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors z-10 pointer-events-none">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center pl-1 border border-white/30 shadow-2xl">
                                    <Play size={32} className="text-white fill-white" />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        title="Video Preview"
                        allowFullScreen
                    ></iframe>
                )}
            </div>

            {/* ACTION BUTTONS (NEW) */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleSaveToggle}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm md:text-base ${
                        isSaved 
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
                        : 'bg-surface border border-border text-foreground hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                >
                    {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
                    {isSaved ? 'Saved' : 'Save Niche'}
                </button>
                <button 
                    onClick={handleWatchExternal}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-surface border border-border text-foreground hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm md:text-base"
                >
                    <ExternalLink size={18} />
                    Watch on {isTikTok ? 'TikTok' : 'YouTube'}
                </button>
            </div>

            {/* Profile & Account Card */}
            <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Ensure Real Image is used */}
                        <img 
                            src={realAvatarUrl || "https://via.placeholder.com/40"} 
                            alt={niche.channel_name}
                            className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 object-cover"
                        />
                        <div className="min-w-0">
                            <div className="font-bold text-foreground flex items-center gap-1 truncate">
                                {niche.author_stats?.nickname || niche.channel_name}
                                {/* Updated Tick UI */}
                                <div className="bg-blue-500 rounded-full p-[2px] flex items-center justify-center w-3.5 h-3.5 shrink-0">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-xs text-muted truncate">@{niche.channel_handle || niche.channel_name.replace(/\s/g, '')}</div>
                        </div>
                    </div>
                    <button 
                        onClick={handleOpenProfile}
                        className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                        View Profile <ExternalLink size={10} />
                    </button>
                </div>
                
                {/* NEW BIO SECTION */}
                <div className="mb-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-white/5">
                    <span className="font-bold text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">Bio</span>
                    {realBio || "No bio available for this account."}
                </div>
                
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-white/5">
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users size={14}/> Followers</span>
                         <span className={stats.isAccountEligible ? "text-green-500 dark:text-green-400 font-bold" : "text-red-500 dark:text-red-400 font-bold"}>
                            {formatCompact(stats.followers)}
                         </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><MapPin size={14}/> Region</span>
                         <span className={stats.isRegionEligible ? "text-green-500 dark:text-green-400 font-mono" : "text-red-500 dark:text-red-400 font-mono"}>
                            {stats.region}
                         </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Calendar size={14}/> Duration</span>
                         <span className={stats.isVideoEligible ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                            {stats.durationStr}
                         </span>
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500"/> Strategy Breakdown</h3>
                    <button onClick={handleRefreshAnalysis} disabled={isRefreshingAnalysis} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-muted hover:text-foreground">
                        {isRefreshingAnalysis ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                    </button>
                </div>
                <div className="space-y-3">
                    {strategyCards.map((card, i) => (
                        <div key={i} className={`p-3 rounded-xl border transition-all ${getThemeClasses(card.theme)}`}>
                            <div className="flex items-center gap-2 mb-1"><card.icon size={12} className="opacity-70" /><span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{card.title}</span></div>
                            <div className="text-xs font-medium leading-relaxed">"{card.value || 'Analyzing...'}"</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* CENTER & RIGHT: Intelligence & Finance */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. REVENUE CALCULATOR */}
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-[#121214] dark:to-[#1a1a1e] border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                             <DollarSign className="text-green-500 dark:text-green-400" size={20}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Calculator</h2>
                            <p className="text-xs text-muted">Creator Rewards Program (Beta)</p>
                        </div>
                    </div>
                     <div className="text-right">
                        <div className={`text-sm font-bold ${stats.isFullyMonetized ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                            {stats.isFullyMonetized ? "Monetization Active" : "Ineligible"}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 mb-6">
                    <div className="p-4 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5">
                        <div className="text-xs text-muted mb-1">Qualified Views</div>
                        <div className={`text-xl font-bold ${stats.isFullyMonetized ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-600'}`}>
                            {stats.qualifiedViews}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5">
                        <div className="text-xs text-muted mb-1">Standard Earnings</div>
                        <div className={`text-xl font-bold ${stats.isFullyMonetized ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-600'}`}>
                            {stats.standardReward}
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                        <div className="text-xs text-yellow-600 dark:text-yellow-500/80 mb-1">Additional Reward</div>
                        <div className={`text-xl font-bold ${stats.isFullyMonetized ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-600'}`}>
                            {stats.additionalReward}
                        </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${stats.isFullyMonetized ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/5 border-red-500/10'}`}>
                        <div className={`text-xs mb-1 ${stats.isFullyMonetized ? 'text-green-600 dark:text-green-300' : 'text-red-400 dark:text-red-300/50'}`}>Total Payout</div>
                        <div className={`text-xl font-bold ${stats.isFullyMonetized ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-600'}`}>
                            {stats.totalRevenue}
                        </div>
                    </div>
                </div>

                {/* Detailed Line Items with RPM Breakdown */}
                <div className="space-y-3 relative z-10 bg-gray-100 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                    <div className="flex justify-between text-sm items-center py-1">
                        <span className="text-gray-600 dark:text-gray-400">Standard RPM</span>
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-muted">Base</span>
                             <span className={stats.isFullyMonetized ? "text-gray-900 dark:text-white font-mono" : "text-gray-500 dark:text-gray-600"}>{stats.standardRpmVal}</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-sm items-center py-1">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                             Additional Reward RPM
                             <span className="text-[10px] bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-1.5 rounded border border-yellow-400/20 hidden xs:inline-block">HIGH VALUE</span>
                        </span>
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-muted">Performance</span>
                             <span className={stats.isFullyMonetized ? "text-yellow-600 dark:text-yellow-400 font-mono" : "text-gray-500 dark:text-gray-600"}>{stats.additionalRpmVal}</span>
                        </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Effective Total RPM</span>
                        <span className={stats.isFullyMonetized ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-500 dark:text-gray-600"}>{stats.rpm}</span>
                    </div>

                    {!stats.isFullyMonetized && (
                         <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" size={16} />
                            <div className="text-xs text-red-600 dark:text-red-300">
                                <span className="font-bold block mb-1">Monetization Ineligible</span>
                                Revenue data is unavailable because {getFailureReason()}
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* AD: AFTER REVENUE CALCULATOR */}
            <AdUnit slot="niche-revenue-after" format="horizontal" className="my-6" />

            {/* 2. NICHE INTELLIGENCE (ENHANCED HOLOGRAPHIC DASHBOARD) */}
            <div className="bg-white dark:bg-[#0f0f11] border border-blue-500/20 rounded-2xl p-0 relative overflow-hidden group shadow-2xl shadow-blue-900/10 transition-all hover:border-blue-500/40">
                {/* Holographic background effects */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,20,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,20,0.05)_2px,transparent_2px)] dark:bg-[linear-gradient(rgba(18,18,20,0.9)_2px,transparent_2px),linear-gradient(90deg,rgba(18,18,20,0.9)_2px,transparent_2px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/5 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 dark:bg-black/40 backdrop-blur-sm gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
                            <Microchip className="text-blue-500 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                Market Hologram
                                {scanActive || isSyncing || isRefreshingAnalysis ? (
                                    <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400 animate-pulse bg-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-500/30">
                                        <RefreshCw size={10} className="animate-spin" /> LIVE SYNC
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-mono text-green-500 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-green-500/30">
                                        <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div> REAL-TIME
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-blue-600 dark:text-blue-300/70 font-mono tracking-wide">Intelligent Data Insights</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:block text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200 dark:border-white/10">
                        <div className="text-[10px] text-gray-500 uppercase font-mono mb-1 mr-auto sm:mr-0">Confidence</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono leading-none">{stats.matchConfidence}%</div>
                    </div>
                </div>

                <div className="p-6 relative z-10">
                    
                    {/* TOP ROW: PATTERN RECOGNITION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 p-4 rounded-xl relative overflow-hidden flex items-center justify-between group/card hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] text-blue-600 dark:text-blue-300 font-mono uppercase mb-1 flex items-center gap-1 font-bold">
                                    <Scan size={12} /> Neural Pattern Match
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {stats.patternMatch}
                                    <CheckCircle size={16} className="text-green-500 dark:text-green-400" />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on {stats.velocity}% growth velocity</div>
                            </div>
                            <div className="h-12 w-12 rounded-full border-2 border-blue-500/30 flex items-center justify-center bg-white dark:bg-black/40 group-hover/card:scale-110 transition-transform">
                                <Radar className="text-blue-500 dark:text-blue-400 animate-spin-slow" size={24} />
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 p-4 rounded-xl relative overflow-hidden flex items-center justify-between group/card hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-colors">
                             <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-transparent"></div>
                             <div className="relative z-10">
                                <div className="text-[10px] text-purple-600 dark:text-purple-300 font-mono uppercase mb-1 flex items-center gap-1 font-bold">
                                    <Cpu size={12} /> AI Verdict
                                </div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {stats.verdict}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stats.compRatio} Competitor Ratio
                                </div>
                             </div>
                             <div className="text-right">
                                <div className={`text-2xl font-bold ${stats.saturation > 70 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                                    {stats.saturation}%
                                </div>
                                <div className="text-[9px] text-gray-500 uppercase font-bold">Saturation</div>
                             </div>
                        </div>
                    </div>

                    <TechSeparator />

                    {/* MAIN GAUGES GRID - USING REAL AI METRICS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 my-8">
                        <GaugeBar 
                            label="Trend Velocity" 
                            value={stats.velocity} 
                            color="bg-gradient-to-r from-blue-600 to-blue-400" 
                            icon={Zap} 
                            subLabel="Growth Speed"
                        />
                        <GaugeBar 
                            label="Algo Score" 
                            value={stats.algoScore} 
                            color="bg-gradient-to-r from-purple-600 to-purple-400" 
                            icon={Binary} 
                            subLabel="Recommendation Prob."
                        />
                        <GaugeBar 
                            label="Audience Power" 
                            value={stats.audPower} 
                            color="bg-gradient-to-r from-pink-600 to-pink-400" 
                            icon={MousePointer2} 
                            subLabel="Click-Through Rate"
                        />
                         <GaugeBar 
                            label="Retention" 
                            value={stats.retention} 
                            color="bg-gradient-to-r from-green-600 to-green-400" 
                            icon={Anchor} 
                            subLabel="Watch Time"
                        />
                        <GaugeBar 
                            label="Viral Potential" 
                            value={stats.viralPot} 
                            color="bg-gradient-to-r from-orange-600 to-orange-400" 
                            icon={Flame} 
                            subLabel="Explosion Risk"
                        />
                        <GaugeBar 
                            label="Monetization" 
                            value={stats.moneyRating} 
                            color="bg-gradient-to-r from-yellow-600 to-yellow-400" 
                            icon={DollarSign} 
                            subLabel="RPM Potential"
                        />
                        <GaugeBar 
                            label="Success Prob." 
                            value={stats.successProb} 
                            color="bg-gradient-to-r from-cyan-600 to-cyan-400" 
                            icon={Target} 
                            subLabel="Win Rate"
                        />
                        <GaugeBar 
                            label="Saturation" 
                            value={stats.saturation} 
                            color="bg-gradient-to-r from-red-600 to-red-500" 
                            icon={ShieldAlert} 
                            subLabel="Market Crowd"
                        />
                    </div>

                    <TechSeparator />

                    {/* DATA POINTS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Target Audience</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Globe size={12} className="text-blue-500 dark:text-blue-400"/> {stats.targetAudience}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Longevity</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity size={12} className="text-green-500 dark:text-green-400"/> {stats.longevity}
                            </div>
                        </div>
                         <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Video Engagement</div>
                            <div className={`text-sm font-bold ${stats.engagementColor} flex items-center gap-2`}>
                                <Heart size={12} /> {stats.videoEngagement}
                            </div>
                            {/* ENGAGEMENT RATE % DISPLAY (REQUESTED FEATURE) */}
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                                Rate: {stats.engagementRate}%
                            </div>
                        </div>
                         <div className="p-3 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 flex flex-col justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Search Vol.</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Search size={12} className="text-yellow-500 dark:text-yellow-400"/> {stats.searchVol}
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>

            {/* AD: AFTER MARKET HOLOGRAM */}
            <AdUnit slot="niche-hologram-after" format="horizontal" className="my-6" />

            {/* 3. PERFORMANCE METRICS (REAL-TIME) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <div className="bg-surface border border-border p-4 rounded-xl">
                    <div className="flex items-center justify-between text-muted text-xs mb-2">
                        <div className="flex items-center gap-2"><Activity size={14} /> Views</div>
                        {isSyncing && <RefreshCw size={10} className="animate-spin text-primary" />}
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-wide">{formatCompact(liveMetrics.views)}</div>
                 </div>
                 <div className="bg-surface border border-border p-4 rounded-xl">
                    <div className="flex items-center justify-between text-muted text-xs mb-2">
                        <div className="flex items-center gap-2"><Heart size={14} /> Likes</div>
                        {isSyncing && <RefreshCw size={10} className="animate-spin text-red-500" />}
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-wide">{formatCompact(liveMetrics.likes)}</div>
                 </div>
                 <div className="bg-surface border border-border p-4 rounded-xl">
                    <div className="flex items-center justify-between text-muted text-xs mb-2">
                        <div className="flex items-center gap-2"><MessageCircle size={14} /> Comments</div>
                        {isSyncing && <RefreshCw size={10} className="animate-spin text-blue-500" />}
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-wide">{formatCompact(liveMetrics.comments)}</div>
                 </div>
                 <div className="bg-surface border border-border p-4 rounded-xl">
                    <div className="flex items-center justify-between text-muted text-xs mb-2">
                        <div className="flex items-center gap-2"><Share2 size={14} /> Shares</div>
                        {isSyncing && <RefreshCw size={10} className="animate-spin text-green-500" />}
                    </div>
                    <div className="text-lg font-bold text-foreground tracking-wide">{formatCompact(liveMetrics.shares)}</div>
                 </div>
            </div>

            {/* 4. CHART */}
            <div className="bg-surface border border-border rounded-2xl p-6 h-80">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-blue-500 dark:text-blue-400" />
                    Revenue Velocity
                </h3>
                {stats.isFullyMonetized ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted opacity-50">
                        <Lock size={32} className="mb-2" />
                        <p className="text-sm">Revenue chart locked</p>
                    </div>
                )}
            </div>

            {/* AD: AFTER VELOCITY CHART */}
            <AdUnit slot="niche-velocity-after" format="horizontal" className="my-6" />

             {/* 5. STRATEGY AUDIT */}
             <div className="bg-[#18181b] border border-border rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-purple-900/10">
                <div className="absolute top-0 right-0 p-32 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 relative z-10 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BrainCircuit className="text-purple-400" />
                            Secret Sauce Declassified
                        </h3>
                        <p className="text-xs text-purple-300/60 font-mono mt-1 flex items-center gap-1">
                            <Sparkles size={10} /> AI-Reverse Engineered Strategy
                        </p>
                    </div>
                    
                    {/* REFRESH AI ANALYSIS BUTTON */}
                    <button 
                        onClick={handleRefreshAnalysis}
                        disabled={isRefreshingAnalysis}
                        className={`text-xs bg-purple-500/10 text-purple-400 hover:text-white hover:bg-purple-500/20 border border-purple-500/20 rounded-lg px-3 py-1.5 font-bold flex items-center gap-2 transition-all ${isRefreshingAnalysis ? 'opacity-70 cursor-not-allowed' : ''}`}
                        title="Update Primary/Sub-Niche with fresh Gemini AI analysis"
                    >
                        {isRefreshingAnalysis ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
                        {isRefreshingAnalysis ? 'Analyzing...' : 'Refresh Intelligence'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    
                    {/* CORE IDENTITY */}
                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-purple-500/30 transition-colors group">
                         <div className="flex items-center gap-2 mb-3 text-xs text-purple-500 dark:text-purple-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <Target size={14} /> Niche Identity
                         </div>
                         <div className="space-y-4">
                             <div>
                                 <div className="text-[10px] text-gray-500 uppercase font-bold">Primary Niche</div>
                                 <div className="text-gray-900 dark:text-white font-bold text-lg">{deep?.primary_niche || "General"}</div>
                             </div>
                             <div>
                                 <div className="text-[10px] text-gray-500 uppercase font-bold">Sub-Niche</div>
                                 <div className="text-purple-600 dark:text-purple-200 font-medium">{deep?.sub_niche || "Viral"}</div>
                             </div>
                              <div className="pt-2 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                                 <div className="text-[10px] text-gray-500 uppercase font-bold">Success Rate</div>
                                 <div className="text-green-500 dark:text-green-400 font-mono font-black">{deep?.success_rate || 50}%</div>
                             </div>
                         </div>
                    </div>

                    {/* TARGET AUDIENCE */}
                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-blue-500/30 transition-colors group flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-xs text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <Users size={14} /> Target Audience
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium flex-grow">
                             {(deep as any)?.targeted_audience || "General Audience"}
                         </p>
                    </div>

                    {/* VISUAL STYLE */}
                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-pink-500/30 transition-colors group flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-xs text-pink-500 dark:text-pink-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <Layers size={14} /> Visual Style & Hook
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium flex-grow">
                             {deep?.hook_technique || "Standard visual hook"}
                         </p>
                    </div>

                    {/* IDEATION SOURCE */}
                    <div className="bg-surface border border-border rounded-xl p-5 hover:border-yellow-500/30 transition-colors group flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-xs text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <Lightbulb size={14} /> Ideation Source
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium flex-grow">
                             {deep?.ideation_source || "Viral recycling & trend jacking."}
                         </p>
                    </div>

                     {/* TOOLS & WORKFLOW */}
                     <div className="bg-surface border border-border rounded-xl p-5 hover:border-orange-500/30 transition-colors group flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-xs text-orange-500 dark:text-orange-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <Wrench size={14} /> Tools & Stack
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium flex-grow">
                             {deep?.tools_used || "CapCut, AI Voiceovers, Stock Footage."}
                         </p>
                    </div>

                     {/* GROWTH HACKS */}
                     <div className="bg-surface border border-border rounded-xl p-5 hover:border-green-500/30 transition-colors group flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-xs text-green-500 dark:text-green-400 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/5 pb-2">
                             <TrendingUp size={14} /> Growth Tactics
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium flex-grow">
                             {deep?.growth_tactics || "High frequency posting & comment baiting."}
                         </p>
                    </div>

                </div>
             </div>

             {/* AD: AFTER SECRET SAUCE */}
             <AdUnit slot="niche-sauce-after" format="horizontal" className="my-6" />

             {/* 6. AI IDEA GENERATION (RESTORED & ENHANCED) */}
             <div className="bg-gray-50 dark:bg-[#121214] border border-border rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 p-32 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                 <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative z-10">
                     <div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             <Wand2 className="text-pink-500 dark:text-pink-400" />
                             Generate ideas with AI
                         </h3>
                         {/* ENHANCED DAILY CREDITS DISPLAY */}
                         <div className="flex items-center gap-2 mt-2 md:mt-0">
                             <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 ${aiRemaining > 0 ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                 <Sparkles size={12} />
                                 {aiRemaining} / {aiDailyLimit} Credits
                             </div>
                             <div className="text-[10px] text-muted flex items-center gap-1 bg-surface border border-border px-2 py-1.5 rounded-lg">
                                 <RefreshCw size={10} /> Daily Reset
                             </div>
                         </div>
                         <p className="text-sm text-muted mt-2">
                            Get five fresh concepts tailored to this video's niche, including hooks, audiences, production notes, and hashtags.
                         </p>
                     </div>
                     <button 
                        onClick={handleGenerateIdeas}
                        disabled={isGeneratingIdeas}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                            isGeneratingIdeas 
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                            : !isPro && !isAdmin
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-white/10 hover:bg-gray-300 dark:hover:bg-gray-700'
                                : 'bg-pink-600 hover:bg-pink-500 text-white hover:scale-[1.02] shadow-pink-600/20'
                        }`}
                     >
                         {isGeneratingIdeas ? <RefreshCw className="animate-spin" size={20} /> : (!isPro && !isAdmin ? <Lock size={18} /> : <Sparkles size={20} />)}
                         {isGeneratingIdeas ? 'Generating...' : (!isPro && !isAdmin ? 'Unlock AI Concepts' : 'Generate 5 Concepts')}
                     </button>
                 </div>

                 {/* Ideas Grid */}
                 {aiIdeas.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4">
                         {aiIdeas.map((idea, idx) => (
                             <div key={idx} className="bg-surface/50 border border-gray-200 dark:border-white/5 rounded-xl p-5 hover:border-pink-500/30 transition-colors flex flex-col group">
                                 <div className="flex items-start justify-between mb-3 border-b border-gray-200 dark:border-white/5 pb-3">
                                     <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{idea.title}</h4>
                                     <div className="text-xs text-pink-500 dark:text-pink-400 font-mono">Concept #{idx+1}</div>
                                 </div>
                                 
                                 <div className="space-y-4 flex-1">
                                     <div>
                                         <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                                             <Anchor size={10} className="text-pink-500 dark:text-pink-400"/> The Hook
                                         </div>
                                         <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-2 border-pink-500/50 pl-2">
                                             "{idea.hook}"
                                         </p>
                                     </div>
                                     
                                     <div>
                                         <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                                            <Clapperboard size={10} className="text-blue-500 dark:text-blue-400"/> Production Notes
                                         </div>
                                         <p className="text-xs text-gray-500 dark:text-gray-400">
                                             {idea.production_notes}
                                         </p>
                                     </div>
                                     
                                     <div>
                                         <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                                            <Hash size={10} className="text-green-500 dark:text-green-400"/> Hashtags
                                         </div>
                                         <div className="flex flex-wrap gap-1">
                                             {idea.hashtags.map((tag, tIdx) => (
                                                 <span key={tIdx} className="text-[10px] text-blue-600 dark:text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                     {tag.startsWith('#') ? tag : `#${tag}`}
                                                 </span>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/5">
                                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                                         <Users size={10} className="text-yellow-600 dark:text-yellow-400"/> Target Audience
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">{idea.target_audience}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
                 
                 {/* Empty State / Prompt */}
                 {aiIdeas.length === 0 && !isGeneratingIdeas && (
                     <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-white/5 rounded-xl bg-gray-100 dark:bg-black/20">
                         <div className="p-3 bg-pink-500/10 rounded-full inline-block mb-3">
                             <Wand2 size={24} className="text-pink-500 dark:text-pink-400" />
                         </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                             Click the button above to use AI Intelligence to brainstorm 5 viral-ready concepts based on this exact video's DNA.
                         </p>
                     </div>
                 )}

                 {/* DISCLAIMER BOX */}
                 <div className="mt-12 bg-green-500/5 border border-dashed border-green-500/30 rounded-xl p-4 text-center">
                     <p className="text-sm font-medium text-green-600 dark:text-green-400">
                         This video detail delivers live, real-time data with minute-by-minute updates for precise performance tracking.
                     </p>
                 </div>

             </div>

             {/* AD: AFTER IDEAS */}
             <AdUnit slot="niche-ideas-after" format="horizontal" className="my-6" />

             {/* RELATED VIDEOS SECTION (RESTORED) */}
             <div className="pt-6">
                 <h2 className="text-2xl font-bold text-foreground mb-6">Videos in the same niche</h2>
                 {relatedVideos.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {relatedVideos.map((relatedNiche) => (
                             <div key={relatedNiche.id} className="transform hover:scale-[1.01] transition-transform">
                                <NicheCard 
                                    data={relatedNiche} 
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} 
                                    isSaved={savedIds.includes(relatedNiche.id)}
                                    onToggleSave={onToggleSave}
                                    isAdmin={isAdmin}
                                    onDelete={onDelete}
                                />
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-12 border border-border rounded-2xl bg-surface/30 text-muted">
                         <p>No other videos found in the "{niche.category}" category yet.</p>
                     </div>
                 )}
             </div>

             {/* AD: BOTTOM OF PAGE */}
             <AdUnit slot="niche-footer-ad" format="horizontal" className="mt-8" />

        </div>
      </div>

      {showUnlockModal && (
          <UnlockModal onClose={() => setShowUnlockModal(false)} onUpgrade={() => {
              setShowUnlockModal(false);
              alert("Please navigate to Settings or Sidebar to Upgrade.");
          }} />
      )}
    </div>
  );
};
