
import React, { useMemo, useState, useEffect } from 'react';
import { NicheData } from '../types';
import { getCachedData } from '../services/geminiService'; // Import cache for real-time updates
import { TrendingUp, Activity, Users, DollarSign, ArrowUpRight, ArrowDownRight, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { AdUnit } from './AdUnit';

interface StatsOverviewProps {
  niches: NicheData[];
  onCategoryClick?: (category: string) => void;
}

// Helper: Format numbers (e.g., 1.2M, 500k) with 1 decimal
const formatCompact = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
  return val.toFixed(1);
};

// Helper: Parse any string/number to raw number
const parseCount = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().replace(/,/g, '').replace(/,/g, ''); // Double replace just in case
    const multiplier = str.toUpperCase().includes('M') ? 1000000 : str.toUpperCase().includes('K') ? 1000 : 1;
    return parseFloat(str.replace(/[^0-9.]/g, '')) * multiplier || 0;
};

// Helper: Calculate Hours since posted
const getHoursAlive = (timestamp: number) => {
    const diff = Date.now() - (timestamp * 1000);
    // Avoid division by zero or extremely small numbers for brand new videos
    return Math.max(0.1, diff / (1000 * 60 * 60)); 
};

// STRICT MAPPING: Maps raw inputs to Sidebar Display Names EXACTLY
const getSidebarCategoryName = (rawCat: string): string => {
    if (!rawCat) return "General";
    const lower = rawCat.toLowerCase();
    
    // Strict Keywords matching Sidebar.tsx
    if (lower.includes('horror') || lower.includes('crime') || lower.includes('scary') || lower.includes('mystery')) return 'Horror / Crime';
    if (lower.includes('stories') || lower.includes('trivia') || lower.includes('facts') || lower.includes('history')) return 'Stories & Trivia';
    if (lower.includes('gaming') || lower.includes('minecraft') || lower.includes('roblox') || lower.includes('game')) return 'Gaming';
    if (lower.includes('motivation') || lower.includes('mindset') || lower.includes('speech')) return 'Motivation';
    if (lower.includes('cars') || lower.includes('auto') || lower.includes('drift')) return 'Cars';
    if (lower.includes('geography') || lower.includes('geo') || lower.includes('maps')) return 'Geography';
    if (lower.includes('ai') || lower.includes('automation') || lower.includes('tech') || lower.includes('chatgpt')) return 'AI Automation';
    if (lower.includes('business') || lower.includes('finance') || lower.includes('money')) return 'Business';
    if (lower.includes('fitness') || lower.includes('gym') || lower.includes('workout')) return 'Fitness';
    
    return "General"; // Catch-all bucket
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ niches, onCategoryClick }) => {
  // State to force re-render every minute for real-time sorting
  const [tick, setTick] = useState(0);
  
  // State for toggling breakdown per category
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (catName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(expandedCards);
      if (newSet.has(catName)) {
          newSet.delete(catName);
      } else {
          newSet.add(catName);
      }
      setExpandedCards(newSet);
  };

  // Effect: Update "tick" every 60 seconds to trigger re-calculation of velocity/ranking
  useEffect(() => {
      const interval = setInterval(() => {
          setTick(prev => prev + 1);
      }, 60000); // 1 minute
      return () => clearInterval(interval);
  }, []);

  // 1. Calculate Global Summaries & Average RPM
  const totalViews = niches.reduce((acc, curr) => acc + parseCount(curr.views), 0);
  const avgScore = niches.length > 0 
    ? Math.round(niches.reduce((acc, curr) => acc + (curr.trending_score || 0), 0) / niches.length) 
    : 0;

  // --- AVG RPM CALCULATION LOGIC ---
  const eligibleVideos = niches.filter(n => {
      const isTikTok = n.video_platform === 'TikTok';
      const followers = n.author_stats?.followers || 0;
      const duration = n.duration || 0;
      // Basic check for monetized videos in the system
      return isTikTok && followers >= 10000 && duration >= 60;
  });

  let avgRpmValue = 0;
  if (eligibleVideos.length > 0) {
      const totalRpmSum = eligibleVideos.reduce((sum, n) => {
          // Replicate NicheDetailPage Logic
          let standardRpm = 0.25;
          const lowerCat = n.category.toLowerCase();
          if(lowerCat.includes('finance') || lowerCat.includes('business')) standardRpm = 0.45;
          else if(lowerCat.includes('tech') || lowerCat.includes('education')) standardRpm = 0.35;

          const views = parseCount(n.views);
          const likes = parseCount(n.engagement.likes);
          const comments = parseCount(n.engagement.comments);
          const shares = parseCount(n.engagement.shares);
          const totalEng = likes + comments + shares;
          const engRate = views > 0 ? (totalEng / views) * 100 : 0;

          let additionalRpm = 0.40;
          if (engRate >= 1.0) additionalRpm += 0.20;
          if (engRate >= 3.0) additionalRpm += 0.20;
          if (engRate >= 6.0) additionalRpm += 0.20;
          if (engRate >= 10.0) additionalRpm += 0.20;
          if (additionalRpm > 1.50) additionalRpm = 1.50;

          return sum + (standardRpm + additionalRpm);
      }, 0);
      avgRpmValue = totalRpmSum / eligibleVideos.length;
  }

  // 2. AGGREGATE DATA BY CATEGORY (Dynamic Top 5 using REAL-TIME CACHE)
  const categoryStats = useMemo(() => {
    const groups: Record<string, {
        count: number;
        videos: NicheData[];
        totalViews: number;
        hourlyVelocitySum: number;
        totalEngagementPct: number;
        recentVideoCount: number; // Last 7 days
        avgAiTrendVelocity: number;
        avgAiSaturation: number;
        avgAiFreshness: number;
    }> = {};

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    niches.forEach(video => {
        // 1. TRY TO GET REAL-TIME DATA FROM CACHE FIRST
        const cachedVideo = video.video_id ? getCachedData(video.video_id) : null;
        
        // Use cached views/engagement if available, otherwise use initial props
        const currentViews = cachedVideo ? parseCount(cachedVideo.views) : parseCount(video.views);
        const currentLikes = cachedVideo ? parseCount(cachedVideo.engagement.likes) : parseCount(video.engagement.likes);
        const currentComments = cachedVideo ? parseCount(cachedVideo.engagement.comments) : parseCount(video.engagement.comments);
        const currentShares = cachedVideo ? parseCount(cachedVideo.engagement.shares) : parseCount(video.engagement.shares);
        const currentCreateTime = cachedVideo && cachedVideo.create_time ? cachedVideo.create_time : (video.create_time || 0);

        // Group strictly by Sidebar Category Name
        const catName = getSidebarCategoryName(video.category || "General");
        
        if (!groups[catName]) {
            groups[catName] = { 
                count: 0, 
                videos: [],
                totalViews: 0, 
                hourlyVelocitySum: 0, 
                totalEngagementPct: 0, 
                recentVideoCount: 0,
                avgAiTrendVelocity: 0,
                avgAiSaturation: 0,
                avgAiFreshness: 0
            };
        }

        // Velocity Calculation: Real-Time Views / Hours Alive
        // This is the core "Hourly Views" metric for the video
        const hoursAlive = currentCreateTime ? getHoursAlive(currentCreateTime) : 24;
        const vVelocity = currentViews / hoursAlive; 

        // Engagement Rate: (Interactions / Views) * 100
        const vEngRate = currentViews > 0 ? ((currentLikes + currentComments + currentShares) / currentViews) * 100 : 0;

        // Competition: Is it recent?
        const isRecent = currentCreateTime ? (now - currentCreateTime * 1000) < sevenDaysMs : false;

        // Gemini Metrics (Static per video usually)
        const metrics = video.niche_metrics || {} as any;

        groups[catName].count += 1;
        groups[catName].videos.push(video);
        groups[catName].totalViews += currentViews;
        
        // Accumulate Velocity for the Category
        groups[catName].hourlyVelocitySum += vVelocity; 
        
        groups[catName].totalEngagementPct += vEngRate;
        if (isRecent) groups[catName].recentVideoCount += 1;
        
        groups[catName].avgAiTrendVelocity += metrics.trend_velocity || 50;
        groups[catName].avgAiSaturation += metrics.saturation_percentage || 50;
        groups[catName].avgAiFreshness += metrics.retention_score || 50;
    });

    // Process Groups into List
    let processed = Object.entries(groups).map(([name, stats]) => {
        const avgEng = stats.totalEngagementPct / stats.count;
        
        // Raw Metrics for breakdown bars
        const rawTrendScore = stats.avgAiTrendVelocity / stats.count;
        const rawSaturation = stats.avgAiSaturation / stats.count;
        const rawFreshness = stats.avgAiFreshness / stats.count;

        return {
            name, // Exact Sidebar Name
            totalViews: stats.totalViews,
            hourlyVelocity: stats.hourlyVelocitySum, // Total Hourly Views for this Category
            engagementRate: avgEng,
            competitionCount: stats.recentVideoCount,
            totalActiveVideos: stats.count,
            
            rawTrendScore,
            rawSaturation,
            rawFreshness
        };
    });

    // 1. SORT STRICTLY BY HOURLY VELOCITY
    processed.sort((a, b) => b.hourlyVelocity - a.hourlyVelocity);

    // 2. CALCULATE NYCH SCORE BASED ON SORTED POSITION AND VELOCITY
    const maxVelocity = processed[0]?.hourlyVelocity || 1; 

    return processed.map(p => {
        // Velocity Score (0-100) relative to the winner
        const velocityScore = Math.min((p.hourlyVelocity / maxVelocity) * 100, 100);
        
        // Secondary Scores (for breakdown display only)
        const engagementScore = Math.min(p.engagementRate * 5, 100); 
        const trendScore = p.rawTrendScore; 
        // Competition Score (Inverted: Lower saturation is better)
        const competitionScore = Math.max(0, 100 - p.rawSaturation); 
        const freshnessScore = p.rawFreshness;

        // Final NYCH Score Algo
        let rawNychScore = (velocityScore * 0.7) + (engagementScore * 0.2) + (trendScore * 0.1);
        
        rawNychScore = Math.max(0, Math.min(100, rawNychScore)); 

        return {
            ...p,
            velocityScore,
            engagementScore,
            trendScore,
            competitionScore,
            freshnessScore,
            nychScore: rawNychScore
        };
    })
    .slice(0, 5); // TOP 5 ONLY

  }, [niches, tick]); // Re-calculate when niches change OR when 'tick' updates (every minute)

  const summaryCards = [
    { label: 'Total Niches', value: niches.length, icon: Activity, change: '+12%', color: 'text-blue-500 dark:text-blue-400' },
    { label: 'Monthly Views', value: `${formatCompact(totalViews)}`, icon: Users, change: '+24%', color: 'text-green-500 dark:text-green-400' },
    { label: 'Avg. Score', value: avgScore, icon: TrendingUp, change: '+5.2%', color: 'text-purple-500 dark:text-purple-400' },
    { 
        label: 'Avg. RPM', 
        value: eligibleVideos.length > 0 ? `$${avgRpmValue.toFixed(2)}` : '$0.00', 
        icon: DollarSign, 
        change: '+1.4%', 
        color: 'text-yellow-600 dark:text-yellow-400' 
    },
  ];

  // LOGIC TO DETERMINE TREND STATUS
  const getTrendStatus = (score: number, velocity: number) => {
      if (score >= 75) {
          return { label: 'Rising', icon: ArrowUpRight, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' };
      }
      if (score >= 40) {
          return { label: 'Stable', icon: ArrowRight, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' };
      }
      return { label: 'Cooling', icon: ArrowDownRight, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' };
  };

  return (
    <div className="space-y-8">
        {/* 1. Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
            <div key={idx} className="bg-surface border border-border p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                    <Icon size={18} className="text-muted" />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.color} bg-opacity-10`}>
                    {card.change}
                </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{card.value}</h3>
                <p className="text-xs text-muted">{card.label}</p>
            </div>
            );
        })}
        </div>

        {/* AD PLACEMENT: DASHBOARD BANNER */}
        <AdUnit slot="dashboard-banner-slot" format="horizontal" />

        {/* 2. Top Viral Ratio Niches (Top 5 Categories) - THEME ADAPTIVE DESIGN */}
        <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                Top Viral Ratio Niches
                <span className="text-xs font-normal text-muted bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded ml-2 flex items-center gap-1 border border-border">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Live Viral Tracking
                </span>
            </h2>
            
            {categoryStats.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-surface/30 text-muted flex flex-col items-center gap-2">
                    <Activity size={24} className="text-gray-500"/>
                    <p>No video data available to analyze.</p>
                    <span className="text-xs text-gray-500">Add videos to generate your Top 5 Viral Niches report.</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryStats.map((cat, idx) => {
                        const trend = getTrendStatus(cat.nychScore, cat.hourlyVelocity);
                        const isExpanded = expandedCards.has(cat.name);

                        return (
                            <div 
                                key={idx} 
                                onClick={() => onCategoryClick && onCategoryClick(cat.name)}
                                className="bg-surface border border-border rounded-xl p-5 shadow-xl hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                            >
                                {/* 1. Header: Rank, Name, Badge */}
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-foreground font-black text-lg">#{idx + 1}</span>
                                        <h3 className="text-lg font-bold text-foreground truncate max-w-[120px]">{cat.name}</h3>
                                    </div>
                                    {/* DYNAMIC BADGE */}
                                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold gap-1 shadow-sm border ${trend.bg} ${trend.color}`}>
                                        <trend.icon size={12} />
                                        {trend.label} {formatCompact(cat.hourlyVelocity)}
                                    </div>
                                </div>

                                {/* 2. Subtitle */}
                                <div className="text-xs text-muted font-medium mb-6">
                                    High velocity · {formatCompact(cat.hourlyVelocity)} views/hr
                                </div>

                                {/* 3. Main NYCH Score */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs text-muted font-bold uppercase tracking-wide">Niche Score</span>
                                        <span className={`text-xl font-bold ${trend.color}`}>{cat.nychScore.toFixed(0)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${cat.nychScore > 75 ? 'bg-green-500' : cat.nychScore > 40 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                                            style={{ width: `${cat.nychScore}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* 4. Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-6 border-b border-border pb-6">
                                    <div>
                                        <div className="text-[10px] text-muted mb-1">Views/hr</div>
                                        <div className="text-sm font-bold text-foreground">{formatCompact(cat.hourlyVelocity)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted mb-1">Engagement</div>
                                        <div className="text-sm font-bold text-foreground">{cat.engagementScore.toFixed(0)}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted mb-1">Competition</div>
                                        <div className="text-sm font-bold text-foreground">{Math.min(cat.totalActiveVideos, 10)}/10</div>
                                    </div>
                                </div>

                                {/* 5. Toggle Header */}
                                <div className="flex items-center justify-between group/toggle" onClick={(e) => toggleCard(cat.name, e)}>
                                    <div className="text-xs text-muted font-bold cursor-pointer group-hover/toggle:text-foreground transition-colors">Score Breakdown</div>
                                    <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                                    </button>
                                </div>

                                {/* 6. Breakdown List (Collapsible) */}
                                {isExpanded && (
                                    <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                        <BreakdownRow label="Trend" value={cat.trendScore} color="bg-purple-500" />
                                        <BreakdownRow label="Engagement" value={cat.engagementScore} color="bg-green-500" />
                                        <BreakdownRow label="Views/Hr" value={cat.velocityScore} color="bg-blue-500" />
                                        <BreakdownRow label="Competition" value={cat.competitionScore} color="bg-orange-500" />
                                        <BreakdownRow label="Freshness" value={cat.freshnessScore} color="bg-cyan-500" />
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

// Mini Component for Breakdown Rows
const BreakdownRow = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted w-20">{label}</span>
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-3 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }}></div>
        </div>
        <span className="text-foreground font-mono w-8 text-right">{value.toFixed(1)}</span>
    </div>
);
