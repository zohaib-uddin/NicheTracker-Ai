
import { GoogleGenAI } from "@google/genai";
import { NicheData, TopVideo, AiContentIdea } from '../types';
import { TIKWM_API_KEY } from '../constants';

// --- CONFIGURATION ---
const TIK_API_BASE = "https://www.tikwm.com/api"; 

// --- GLOBAL REAL-TIME CACHE ---
export const REALTIME_CACHE: Record<string, NicheData> = {};

export const getCachedData = (videoId: string): NicheData | undefined => {
    return REALTIME_CACHE[videoId];
};

export const updateCache = (videoId: string, data: NicheData) => {
    if (!videoId) return;
    const existing = REALTIME_CACHE[videoId] || {};
    REALTIME_CACHE[videoId] = { ...existing, ...data };
};

// --- HELPER: ROBUST JSON PARSING ---
const parseJsonFromText = (text: string | undefined): any => {
  if (!text) return null;
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstOpenBrace = cleanText.indexOf('{');
  const firstOpenBracket = cleanText.indexOf('[');
  let start = -1;
  let end = -1;

  if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
      start = firstOpenBracket;
      end = cleanText.lastIndexOf(']');
  } else if (firstOpenBrace !== -1) {
      start = firstOpenBrace;
      end = cleanText.lastIndexOf('}');
  }

  if (start !== -1 && end !== -1 && end >= start) {
    cleanText = cleanText.substring(start, end + 1);
  }

  try { 
      return JSON.parse(cleanText); 
  } catch (e) { 
      console.warn("JSON Parse Failed:", e);
      return null; 
  }
};

const extractUsername = (input: string): string => {
    let clean = input.trim();
    try {
        if (clean.includes('tiktok.com')) {
            const url = new URL(clean);
            const pathParts = url.pathname.split('/');
            const userPart = pathParts.find(p => p.startsWith('@'));
            if (userPart) return userPart.replace('@', '');
        }
    } catch (e) { }

    const match = clean.match(/@([a-zA-Z0-9_.-]+)/);
    if (match) return match[1];
    
    clean = clean.split('?')[0];
    if (!clean.includes('/') && !clean.includes(' ')) return clean.replace('@', '');
    
    return clean;
};

const extractVideoId = (input: string): string | null => {
    try {
        const match = input.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
    } catch (e) { return null; }
};

const safeParseInt = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().replace(/,/g, '').toUpperCase();
    if (str.includes('M')) return parseFloat(str) * 1000000;
    if (str.includes('K')) return parseFloat(str) * 1000;
    return parseInt(str) || 0;
};

// --- API LAYER ---
const fetchWithFailover = async (endpoint: string, params: string) => {
    let targetUrl = `${TIK_API_BASE}${endpoint}?${params}`;
    if (TIKWM_API_KEY) {
        targetUrl += `&api_key=${TIKWM_API_KEY}`;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(new Error("Direct fetch timeout")), 8000); 
        console.log(`[API] Trying Direct: ${targetUrl.substring(0, 60)}...`);
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
            const json = await res.json();
            if (json && (json.code === 0 || json.data)) {
                return json;
            }
        }
    } catch(e) { }

    const proxies = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    for (const createProxy of proxies) {
        try {
            const res = await fetch(createProxy(targetUrl));
            if (res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    if (json && (json.code === 0 || json.data)) return json;
                } catch(e) {}
            }
        } catch (e) {}
    }
    return null;
};

// --- STATS ONLY FETCH ---
export const fetchVideoStatsOnly = async (videoUrl: string): Promise<Partial<NicheData> | null> => {
    const targetVideoId = extractVideoId(videoUrl);
    if (!targetVideoId) return null;

    try {
        const res = await fetchWithFailover('/', `url=${encodeURIComponent(videoUrl)}`);
        
        if (res?.data) {
            const vData = res.data;
            const author = vData.author;
            
            let followers = safeParseInt(author?.followerCount || author?.followers || 0);
            let bio = author?.signature || "";
            
            // If bio is missing OR followers are missing, fetch full user profile to get real bio/stats
            if ((!bio || followers === 0) && author?.unique_id) {
                 try {
                     const userRes = await fetchWithFailover('/user/info', `unique_id=${author.unique_id}`);
                     if (userRes?.data?.user) {
                         const uUser = userRes.data.user;
                         const uStats = userRes.data.stats || uUser;
                         
                         // Update fields if we found better data from user profile
                         if (followers === 0) followers = safeParseInt(uStats.followerCount || uStats.followers || 0);
                         if (!bio || bio.length < (uUser.signature?.length || 0)) bio = uUser.signature || bio;
                     }
                 } catch(err) {}
            }

            return {
                views: safeParseInt(vData.play_count).toString(),
                engagement: {
                    likes: safeParseInt(vData.digg_count).toString(),
                    comments: safeParseInt(vData.comment_count).toString(),
                    shares: safeParseInt(vData.share_count).toString()
                },
                author_stats: {
                    followers: followers,
                    hearts: safeParseInt(author?.heart || author?.heartCount || 0),
                    videos: safeParseInt(author?.videoCount || author?.video || 0),
                    nickname: author?.nickname,
                    unique_id: author?.unique_id
                },
                create_time: vData.create_time,
                duration: vData.duration,
                video_url: vData.play,
                cover_url: vData.cover || vData.origin_cover,
                channel_avatar_url: author?.avatarMedium || author?.avatar || author?.avatarThumb || "",
                author_bio: bio || "No bio available."
            } as any;
        }
    } catch (e) {}
    return null;
};

export const generateContentIdeas = async (niche: NicheData): Promise<AiContentIdea[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
            Analyze this TikTok/YouTube video data and generate 5 viral content ideas for the same niche.
            
            Video Title: "${niche.title}"
            Category: "${niche.category}"
            Current Stats: ${niche.views} views, ${niche.engagement.likes} likes.
            Description: "${niche.description}"
            Keywords: ${niche.keywords.join(', ')}
            
            Output strictly valid JSON with this schema:
            [
              {
                "title": "Catchy Title",
                "hook": "Visual/Audio Hook description",
                "target_audience": "Who is this for?",
                "production_notes": "Filming/Editing tip",
                "hashtags": ["#tag1", "#tag2"]
              }
            ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const text = response.text;
        const json = parseJsonFromText(text);
        return Array.isArray(json) ? json : [];
    } catch (error) {
        console.error("AI Generation Error:", error);
        return [];
    }
};

// --- MAIN ANALYZE PROFILE ---
export const analyzeProfile = async (inputUrl: string): Promise<NicheData> => {
    let username = extractUsername(inputUrl);
    console.log(`[Analyzer] Processing URL: ${inputUrl}`);

    let deepVideoData: any = null;
    let realRegion = "";
    let postsData: any = null;

    // 1. VIDEO DETECTION
    const targetVideoId = extractVideoId(inputUrl);
    if (targetVideoId) {
        const res = await fetchWithFailover('/', `url=${encodeURIComponent(inputUrl)}`);
        if (res?.data) {
            deepVideoData = res.data;
            if (deepVideoData.region) realRegion = deepVideoData.region;
            if (!username && deepVideoData.author?.unique_id) username = deepVideoData.author.unique_id;
        }
    }

    if (!username && !deepVideoData) throw new Error("Could not extract username or video data.");

    // 2. FETCH POSTS
    if (username) {
        postsData = await fetchWithFailover('/user/posts', `unique_id=${username}&count=35`); 
    }
    
    // 3. DATA ASSEMBLY
    let authorData = deepVideoData?.author;
    let statsData = deepVideoData?.author; 

    const hasFollowerData = statsData && (statsData.followerCount !== undefined || statsData.followers !== undefined);
    
    // Updated Condition: Also fetch full profile if signature (bio) is missing
    const needsFullProfile = !authorData || !hasFollowerData || (!authorData.createTime && !authorData.create_time) || !authorData.signature;

    if (needsFullProfile) {
         const infoData = await fetchWithFailover('/user/info', `unique_id=${username}`);
         if (infoData?.data?.user) {
             const userInfo = infoData.data.user;
             const userStats = infoData.data.stats || infoData.data.user;
             if (!authorData) {
                 authorData = userInfo;
                 statsData = userStats;
             } else {
                 statsData = userStats;
                 if (!authorData.avatarMedium) authorData.avatarMedium = userInfo.avatarMedium;
                 if (!authorData.createTime) authorData.createTime = userInfo.createTime;
                 if (!authorData.create_time) authorData.create_time = userInfo.create_time;
                 // Prioritize bio from user info
                 authorData.signature = userInfo.signature || authorData.signature; 
             }
             if ((!realRegion || realRegion === "") && userInfo.region) realRegion = userInfo.region;
         }
    }

    if (!authorData) throw new Error("Could not retrieve account data");
    if (!realRegion) realRegion = "US";

    const totalVideos = safeParseInt(statsData.videoCount || statsData.video);
    const totalFollowers = safeParseInt(statsData.followerCount || statsData.followers);
    const totalHearts = safeParseInt(statsData.heart || statsData.heartCount);
    
    const now = Math.floor(Date.now() / 1000);
    // If account create time is missing, default to 1 year ago or infer from first video
    let accountCreateTime = authorData.createTime || authorData.create_time;
    if (!accountCreateTime) {
        // Fallback: Use oldest video time if available, otherwise 1 year ago
        if (postsData?.data?.videos && postsData.data.videos.length > 0) {
             const videos = postsData.data.videos;
             const oldest = videos[videos.length-1].create_time;
             accountCreateTime = oldest;
        } else {
             accountCreateTime = (now - (365 * 86400));
        }
    }

    // ---------------------------------------------------------
    // 4. REAL FREQUENCY & HISTORY ENGINE
    // ---------------------------------------------------------
    let calculatedWeeklyRate = 0;
    let calculatedDailyRate = 0;
    let calculatedConsistency = 0;
    let growthHistory: any[] = [];
    
    // A. FREQUENCY MATH (Strict 7 Day Window)
    if (postsData?.data?.videos && postsData.data.videos.length > 0) {
        const rawVideos = postsData.data.videos;
        const sevenDaysAgo = now - (7 * 86400);
        const videosLastWeek = rawVideos.filter((v: any) => v.create_time > sevenDaysAgo).length;
        
        calculatedWeeklyRate = videosLastWeek;
        calculatedDailyRate = Math.round((videosLastWeek / 7) * 10) / 10;
        
    } else {
        // Fallback: Estimate from totals if no post data or empty list
        // Limit age divisor to avoid infinite rate for brand new accounts
        const accountAgeDays = Math.max((now - accountCreateTime) / 86400, 1);
        
        // Calculate raw average
        const ratePerDay = totalVideos / accountAgeDays;
        
        // Populate the variables so UI doesn't show 0
        calculatedDailyRate = Number(ratePerDay.toFixed(2));
        calculatedWeeklyRate = Math.round(ratePerDay * 7);
        if (calculatedWeeklyRate === 0 && totalVideos > 0) calculatedWeeklyRate = 1; // Minimum 1 if videos exist
    }

    // NEW STRICT PERCENTAGES
    if (calculatedWeeklyRate >= 6) calculatedConsistency = 100;
    else if (calculatedWeeklyRate === 5) calculatedConsistency = 85;
    else if (calculatedWeeklyRate === 4) calculatedConsistency = 65;
    else if (calculatedWeeklyRate === 3) calculatedConsistency = 45;
    else if (calculatedWeeklyRate === 2) calculatedConsistency = 20;
    else if (calculatedWeeklyRate === 1) calculatedConsistency = 10;
    else calculatedConsistency = 0;

    // B. GROWTH TIMELINE ENGINE (LIFETIME & MONTHLY SUPPORT)
    // We generate a daily point for the entire lifespan to support accurate chart filtering
    const totalDaysAlive = Math.ceil((now - accountCreateTime) / 86400);
    const estimatedTotalLifetimeViews = Math.max(totalHearts * 10, totalVideos * 1000); // Heuristic
    
    // Growth Curve Simulation
    const dayStep = 86400;
    for (let t = accountCreateTime; t <= now; t += dayStep) {
        const progress = Math.min(1, (t - accountCreateTime) / (now - accountCreateTime));
        let curve = Math.pow(progress, 2.5); 
        const fluctuation = (Math.sin(progress * Math.PI * 10) * 0.05); 
        curve = Math.max(0, Math.min(1, curve + fluctuation));

        if (t >= now - dayStep) {
            growthHistory.push({
                date: new Date(t * 1000).toISOString(),
                views: estimatedTotalLifetimeViews,
                followers: totalFollowers
            });
        } else {
            const interpolatedViews = Math.floor(estimatedTotalLifetimeViews * curve);
            const interpolatedFollowers = Math.floor(totalFollowers * curve);
            growthHistory.push({
                date: new Date(t * 1000).toISOString(),
                views: interpolatedViews,
                followers: interpolatedFollowers
            });
        }
    }

    // 5. AI ANALYSIS INTEGRATION (REAL GEMINI CALL)
    const realTitle = deepVideoData?.title || deepVideoData?.desc || `Video by @${username}`;
    const realDesc = deepVideoData?.desc || "No description provided.";
    
    let aiMetrics: any = {};
    let aiAnalysis: any = {};
    let aiInsight = "";

    // Only call Gemini if API Key is present
    if (process.env.API_KEY) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
            Analyze this TikTok/YouTube video data to provide data for a "Viral Niche Dashboard".
            
            Video Title: "${realTitle}"
            Description: "${realDesc}"
            Creator Name: "${authorData.nickname}"
            Stats: ${totalHearts} Likes, ${totalFollowers} Followers.
            
            Task: Act as a social media algorithm expert. Analyze the content metadata and stats to infer specific niche strategies and market metrics.
            
            Return a valid JSON object with THREE main keys: "metrics", "analysis", and "one_line_insight".
            
            "one_line_insight": "String (A single, punchy, expert AI insight sentence explaining why this specific video content is viral or valuable, based on its title and stats. Do NOT use hashtags.)",

            "analysis": {
              "primary_niche": "String (e.g. Gaming, Finance, DIY)",
              "sub_niche": "String (Specific micro-niche)",
              "targeted_audience": "String (Demographic)",
              "winning_strategy": "String (5-7 words on why it works)",
              "hook_technique": "String (Visual/Audio hook style)",
              "call_to_action_type": "String",
              "audio_signature": "String",
              "caption_seo_strategy": "String",
              "editing_pacing": "String",
              "ideation_source": "String",
              "tools_used": "String",
              "growth_tactics": "String",
              "success_rate": Number (0-100)
            }
            
            "metrics": {
              "trend_velocity": Number (0-100, growth speed),
              "algo_score": Number (0-100, algorithm affinity),
              "audience_power": Number (0-100, engagement depth),
              "retention_score": Number (0-100, estimated watch time),
              "viral_potential": Number (0-100),
              "monetization_rating": Number (0-100),
              "saturation_percentage": Number (0-100, 100 is saturated),
              "success_probability": Number (0-100),
              "verdict": "String (e.g. 'Viral Goldmine', 'Crowded', 'Rising')",
              "competitor_ratio": "String (e.g. '1:500')",
              "trend_longevity": "String (e.g. 'Evergreen', '2 Weeks')",
              "search_volume": "String (e.g. 'High', 'Explosive')",
              "neural_pattern_match": "String (e.g. 'Dopamine Stacking', 'Shock Value')",
              "content_fatigue": "String (Low/Med/High)"
            }
            `;
            
            const req = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            
            const jsonText = req.text;
            if (jsonText) {
                const parsed = parseJsonFromText(jsonText);
                if (parsed) {
                    aiMetrics = parsed.metrics || {};
                    aiAnalysis = parsed.analysis || {};
                    aiInsight = parsed.one_line_insight || "";
                }
            }
        } catch (e) {
            console.warn("Gemini Analysis Failed:", e);
        }
    }

    // FALLBACK DEFAULTS IF AI FAILS
    const metrics = {
        trend_velocity: aiMetrics.trend_velocity || 50,
        algo_score: aiMetrics.algo_score || 50,
        audience_power: aiMetrics.audience_power || 50,
        retention_score: aiMetrics.retention_score || 50,
        viral_potential: aiMetrics.viral_potential || 50,
        monetization_rating: aiMetrics.monetization_rating || 50,
        success_probability: aiMetrics.success_probability || 50,
        saturation_percentage: aiMetrics.saturation_percentage || 50,
        target_country: realRegion,
        verdict: aiMetrics.verdict || "Analyzing...",
        video_engagement_label: "Active",
        trend_longevity: aiMetrics.trend_longevity || "Stable",
        competitor_ratio: aiMetrics.competitor_ratio || "1:100",
        search_volume: aiMetrics.search_volume || "Medium",
        neural_pattern_match: aiMetrics.neural_pattern_match || "Standard",
        daily_competitor_uploads: 15,
        avg_niche_engagement: 8.5
    };

    // Extract specific video stats if available (Prioritize Real Video Data)
    const videoStats = {
        views: deepVideoData ? safeParseInt(deepVideoData.play_count) : 0,
        likes: deepVideoData ? safeParseInt(deepVideoData.digg_count) : 0,
        comments: deepVideoData ? safeParseInt(deepVideoData.comment_count) : 0,
        shares: deepVideoData ? safeParseInt(deepVideoData.share_count) : 0,
    };

    // Use Video Stats if available, otherwise fall back to Account Stats (totalHearts) for profile scans
    const displayViews = deepVideoData ? videoStats.views : totalHearts; 
    const displayLikes = deepVideoData ? videoStats.likes : totalHearts;
    const displayComments = deepVideoData ? videoStats.comments : 0;
    const displayShares = deepVideoData ? videoStats.shares : 0;

    const finalData: NicheData = {
        id: `prof-${Date.now()}-${Math.random()}`,
        title: realTitle, 
        // Use AI Insight for description if available, otherwise real description
        description: aiInsight || realDesc, 
        platform: ['TikTok'],
        views: displayViews.toString(), // Use Correct Video Views
        growth: "N/A",
        difficulty: "Medium",
        category: aiAnalysis.primary_niche || "General",
        cpm: "N/A",
        trending_score: 80,
        keywords: [],
        video_id: targetVideoId || "", 
        video_platform: 'TikTok',
        channel_name: authorData.nickname || username,
        channel_handle: authorData.unique_id || username,
        channel_avatar_url: authorData.avatarMedium || "",
        author_bio: authorData.signature || "No bio.",
        duration: deepVideoData ? safeParseInt(deepVideoData.duration) : 0,
        create_time: deepVideoData ? deepVideoData.create_time : accountCreateTime,
        region: realRegion, 
        author_stats: {
            followers: totalFollowers,
            hearts: totalHearts,
            videos: totalVideos
        },
        niche_metrics: metrics,
        deep_analysis: {
            primary_niche: aiAnalysis.primary_niche || "General",
            sub_niche: aiAnalysis.sub_niche || "Variety",
            winning_strategy: aiAnalysis.winning_strategy || "Consistent posting",
            hook_technique: aiAnalysis.hook_technique || "Visual",
            call_to_action_type: aiAnalysis.call_to_action_type || "Follow",
            audio_signature: aiAnalysis.audio_signature || "Trending",
            caption_seo_strategy: aiAnalysis.caption_seo_strategy || "Standard",
            editing_pacing: aiAnalysis.editing_pacing || "Fast",
            ideation_source: aiAnalysis.ideation_source || "Trends",
            tools_used: aiAnalysis.tools_used || "Mobile",
            growth_tactics: aiAnalysis.growth_tactics || "Frequency",
            targeted_audience: aiAnalysis.targeted_audience || "General Audience",
            success_rate: aiAnalysis.success_rate || 50,
            
            account_age_days: Math.floor((now - accountCreateTime) / 86400),
            growth_history: growthHistory, 
            daily_post_frequency: calculatedDailyRate,
            weekly_upload_rate: calculatedWeeklyRate,
            consistency_score: calculatedConsistency, 
            upload_heatmap: [], 
            most_active_day: "N/A",
        },
        top_videos: [], 
        engagement: { 
            likes: displayLikes.toString(), 
            comments: displayComments.toString(), 
            shares: displayShares.toString() 
        }
    };
    
    (finalData as any).video_url = deepVideoData?.play || "";
    finalData.cover_url = deepVideoData?.cover || "";

    if (finalData.video_id) updateCache(finalData.video_id, finalData);
    
    return finalData;
};

export const analyzeVideoUrl = async (url: string): Promise<NicheData> => analyzeProfile(url); 
export const fetchTrendingNiches = async (): Promise<NicheData[]> => [];
