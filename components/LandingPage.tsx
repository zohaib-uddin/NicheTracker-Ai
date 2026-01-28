
import React, { useState, useEffect, useRef } from 'react';
import { 
    Zap, CheckCircle, XCircle, ArrowRight, Play, BarChart2, Layers, Lightbulb, 
    Globe, Facebook, Instagram, Plus, Minus, Heart, MessageCircle, Share2, Bookmark, Music, Loader2, Menu, X
} from 'lucide-react';
import { fetchVideoStatsOnly } from '../services/geminiService';
import { AdUnit } from './AdUnit';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onViewLegal?: (type: 'privacy' | 'terms' | 'refund' | 'affiliate') => void;
    onViewPricing?: () => void;
    isLoggedIn?: boolean; // New Prop
}

// --- REUSABLE TIKTOK PHONE COMPONENT (UPDATED FOR RESPONSIVENESS) ---
const TikTokPhone = ({ 
    videoUrl, 
    displayName, 
    description, 
    likes, 
    comments, 
    saves, 
    shares, 
    pfpUrl, 
    rotate = 0,
    translateY = 0,
    loading = false,
    className = ""
}: any) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);

    // Force Play Effect
    useEffect(() => {
        if (videoRef.current && videoUrl && !loading) {
            videoRef.current.defaultMuted = true;
            videoRef.current.muted = true; // Crucial for autoplay
            
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play prevented:", error);
                    // Retry once if needed or just handle gracefully
                    if(videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.play().catch(e => console.error("Retry failed", e));
                    }
                });
            }
        }
    }, [videoUrl, loading]);

    return (
        <div 
            className={`rounded-[2.5rem] border-[6px] border-[#27272a] bg-black overflow-hidden shadow-2xl relative z-10 transform transition-all duration-500 hover:z-20 hover:scale-[1.02] w-[240px] h-[500px] md:w-[280px] md:h-[580px] ${className}`}
            style={{ 
                // Rotate only applied via style variable to allow class overrides via className
                '--tw-rotate': `${rotate}deg`,
                '--tw-translate-y': `${translateY}px`
            } as React.CSSProperties}
        >
            <div className="w-full h-full bg-gray-900 relative phone-content transform md:rotate-[var(--tw-rotate)] md:translate-y-[var(--tw-translate-y)]">
                {/* Video Layer */}
                <div className="w-full h-full bg-gray-900 relative">
                    {(loading || !videoUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                            <Loader2 className="animate-spin text-green-500" size={32} />
                        </div>
                    )}
                    
                    <video 
                        ref={videoRef}
                        src={videoUrl} 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        preload="auto"
                        onLoadedData={() => setIsVideoLoaded(true)}
                    />
                </div>
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>

                {/* UI: Right Sidebar */}
                <div className="absolute bottom-20 right-2 flex flex-col items-center gap-4 z-20">
                    {/* Profile */}
                    <div className="relative mb-2">
                        <div className="w-10 h-10 rounded-full border border-white p-0.5 overflow-hidden bg-black">
                            <img src={pfpUrl || "https://via.placeholder.com/40"} alt="profile" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                            <Plus size={8} className="text-white" />
                        </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-col items-center gap-1">
                        <Heart size={28} className="text-white fill-white" />
                        <span className="text-white text-xs font-bold drop-shadow-md">{likes}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <MessageCircle size={28} className="text-white fill-white" />
                        <span className="text-white text-xs font-bold drop-shadow-md">{comments}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Bookmark size={28} className="text-white fill-white" />
                        <span className="text-white text-xs font-bold drop-shadow-md">{saves}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Share2 size={28} className="text-white fill-white" />
                        <span className="text-white text-xs font-bold drop-shadow-md">{shares}</span>
                    </div>
                </div>

                {/* UI: Bottom Info */}
                <div className="absolute bottom-4 left-4 right-16 z-20 text-left">
                    <div className="text-white font-bold text-sm mb-1 shadow-black drop-shadow-md">{displayName}</div>
                    <p className="text-white text-xs leading-snug opacity-90 shadow-black drop-shadow-md line-clamp-2 text-left font-medium">
                        {description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Music size={12} className="text-white animate-spin-slow" />
                        <div className="text-white text-[10px] w-24 overflow-hidden whitespace-nowrap">
                            <span className="animate-marquee inline-block">Original Sound - {displayName}</span>
                        </div>
                    </div>
                </div>

                {/* UI: Rotating Disc */}
                <div className="absolute bottom-4 right-4 z-20">
                    <div className="w-10 h-10 bg-black rounded-full p-2 animate-spin-slow border-4 border-gray-800">
                        <img src={pfpUrl || "https://via.placeholder.com/40"} className="w-full h-full rounded-full object-cover" alt="disc" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onViewLegal, onViewPricing, isLoggedIn }) => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    
    // State for Mobile Menu
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // State for Real Video Data
    const [videoData, setVideoData] = useState<any[]>([null, null, null]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    const toggleFaq = (index: number) => {
        setFaqOpen(faqOpen === index ? null : index);
    };

    // POOL OF VIDEOS
    const ALL_VIDEOS = [
        "https://www.tiktok.com/@maeday_lol/video/7594246165432995085",
        "https://www.tiktok.com/@dunk/video/7596522498884144406",
        "https://www.tiktok.com/@horror_chronicles/video/7596387450893667614",
        "https://www.tiktok.com/@ratel.meister/video/7595983664052292886",
        "https://www.tiktok.com/@motivationalinsight/video/7596460466390519071",
        "https://www.tiktok.com/@heath_up1/video/7595199910450957598",
        "https://www.tiktok.com/@mapperfrom.polska1/video/7595284469720943894",
        "https://www.tiktok.com/@cutieloop0/video/7595287803810909458",
        "https://www.tiktok.com/@quizzes171/video/7595815347010243853",
        "https://www.tiktok.com/@g00ning_goddess0/video/7595341995871145238",
        "https://www.tiktok.com/@brainrot.stories12/video/7597519029925989645",
        "https://www.tiktok.com/@arianaxselena/video/7594324686574538039"
    ];

    useEffect(() => {
        const fetchAllVideos = async () => {
            setLoadingVideos(true);
            try {
                const shuffled = [...ALL_VIDEOS].sort(() => 0.5 - Math.random());
                const selectedLinks = shuffled.slice(0, 3);
                const promises = selectedLinks.map(link => fetchVideoStatsOnly(link));
                const results = await Promise.all(promises);
                
                const fmt = (val: string | number) => {
                    if(!val) return "0";
                    let num = typeof val === 'string' ? parseInt(val) : val;
                    if(num > 1000000) return (num/1000000).toFixed(1) + "M";
                    if(num > 1000) return (num/1000).toFixed(1) + "K";
                    return num.toString();
                };

                const formattedResults = results.map((res: any) => {
                    if (!res) {
                        return {
                            videoUrl: "", 
                            displayName: "User", 
                            description: "Trending Video",
                            likes: "0", 
                            comments: "0", 
                            shares: "0",
                            saves: "0",
                            pfpUrl: ""
                        };
                    }
                    
                    const likesCount = parseInt(res.engagement?.likes || "0");
                    const estSaves = Math.floor(likesCount * 0.12);

                    return {
                        videoUrl: res.video_url,
                        displayName: res.author_stats?.nickname || res.channel_name || "User", 
                        description: res.title || res.desc || "Viral video",
                        likes: fmt(res.engagement?.likes || 0),
                        comments: fmt(res.engagement?.comments || 0),
                        saves: fmt(estSaves), 
                        shares: fmt(res.engagement?.shares || 0),
                        pfpUrl: res.channel_avatar_url
                    };
                });
                setVideoData(formattedResults);
            } catch (error) {
                console.error("Failed to load landing page videos", error);
            } finally {
                setLoadingVideos(false);
            }
        };

        fetchAllVideos();
    }, []);

    const TikTokIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
    );

    const faqItems = [
        { q: "Can I Cancel My Plan?", a: "Yes, you can cancel your plan at any time in settings. Your plan will remain active until the end of your billing cycle." },
        { q: "Am I limited to the amount of niches I can research?", a: "No, there is 1 simple plan which grants you access to unlimited niche research with new niches being uploaded every day." },
        { q: "How often are new viral videos updated?", a: "Every single day, new viral videos and therefore fresh viral niches are updated onto the site." },
        { q: "Are all niches shown monetiseable?", a: "Yes, the founders Zohaib and Hadi both actively partake in TikTok and YouTube's monetisation programs and therefore the niches shown for each are only ones that are monetiseable. You may have to make small tweaks such as ensuring videos are over 1 minute long for TikTok." },
        { q: "What is the NicheTracker score?", a: "The NicheTracker score is our rating out of 100 on how viral the niche is. This takes into account: The views per hour, the engagement rate and the amount of competition." },
        { q: "Do you have a refund policy?", a: "Unfortunately, we do not offer refunds. You can cancel your plan at anytime and it will remain active until the end of the billing cycle." }
    ];

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-green-500/30 scroll-smooth">
            
            {/* --- FLOATING NAVBAR --- */}
            <div className="fixed top-6 left-0 right-0 flex justify-center z-50 px-4">
                <nav className="bg-[#09090b]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center gap-8 pointer-events-auto max-w-5xl w-full justify-between transition-all duration-300 relative">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Zap className="text-white w-4 h-4 fill-current" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">NicheTracker</span>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        {['Features', 'Pricing', 'Feedback', 'FAQ'].map((item) => (
                            <a 
                                key={item} 
                                href={`#${item.toLowerCase()}`} 
                                className="text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 px-4 py-1.5 rounded-full transition-all"
                            >
                                {item}
                            </a>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Modified: Show Dashboard if logged in */}
                        <button onClick={onLogin} className="text-xs font-bold text-gray-300 hover:text-white transition-colors px-2">
                            {isLoggedIn ? 'Dashboard' : 'Log In'}
                        </button>
                        <button 
                            onClick={onGetStarted}
                            className="bg-green-500 hover:bg-green-400 text-black text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden p-2 text-gray-300 hover:text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Mobile Menu Dropdown */}
                    {mobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-4 bg-[#18181b] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 md:hidden">
                            {['Features', 'Pricing', 'Feedback', 'FAQ'].map((item) => (
                                <a 
                                    key={item} 
                                    href={`#${item.toLowerCase()}`} 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-sm font-medium text-gray-300 hover:text-white py-2 border-b border-white/5 last:border-0"
                                >
                                    {item}
                                </a>
                            ))}
                            <div className="flex flex-col gap-3 mt-2">
                                <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-bold text-gray-300 bg-white/5 rounded-xl hover:bg-white/10">
                                    {isLoggedIn ? 'Dashboard' : 'Log In'}
                                </button>
                                <button onClick={() => { onGetStarted(); setMobileMenuOpen(false); }} className="w-full py-3 text-sm font-bold text-black bg-green-500 rounded-xl hover:bg-green-400">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
                </nav>
            </div>

            {/* --- HERO SECTION --- */}
            <header className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        Discover TikTok and <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">YouTube Niches First</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Get the head start and go viral every time. Discover top-performing niches first and supercharge the virality of your short-form content effortlessly.
                    </p>
                    
                    <button 
                        onClick={onGetStarted}
                        className="group bg-green-500 hover:bg-green-400 text-black text-lg font-bold px-10 py-4 rounded-full transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                        Track Niches Now
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* 3 REALISTIC TIKTOK PHONES WITH REAL DATA (RESPONSIVE STACK ON MOBILE) */}
                    <div className="mt-24 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 relative perspective-1000">
                        
                        {/* PHONE 1: LEFT */}
                        <TikTokPhone 
                            rotate={-12}
                            translateY={40}
                            loading={loadingVideos}
                            {...videoData[0]}
                            className="md:block transform md:-rotate-12 md:translate-y-10 scale-90 md:scale-100"
                        />

                        {/* PHONE 2: CENTER */}
                        <TikTokPhone 
                            rotate={0}
                            translateY={0}
                            loading={loadingVideos}
                            {...videoData[1]}
                            className="z-20 scale-100 md:scale-105 shadow-[0_0_50px_rgba(34,197,94,0.2)]"
                        />

                        {/* PHONE 3: RIGHT */}
                        <TikTokPhone 
                            rotate={12}
                            translateY={40}
                            loading={loadingVideos}
                            {...videoData[2]}
                            className="md:block transform md:rotate-12 md:translate-y-10 scale-90 md:scale-100"
                        />

                    </div>
                </div>
            </header>

            {/* AD PLACEMENT: BELOW HERO */}
            <div className="max-w-6xl mx-auto px-6 mb-12">
                <AdUnit slot="landing-hero-slot" format="horizontal" />
            </div>

            {/* --- VALUE PROP / FEATURES --- */}
            <section id="features" className="py-24 px-6 bg-[#0c0c0e]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            We aim to be the most reliable source for  discovering niches <br /> that have already proven <span className="text-green-500">their viral potential</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1: Daily Viral Niches */}
                        <div className="group bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden hover:border-green-500/30 transition-all hover:bg-[#1f1f22]">
                            <div className="h-56 overflow-hidden relative">
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                                    <img 
                                        src="public/dailyviral.png" 
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                                        alt="Viral Dashboard" 
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>
                            </div>
                            <div className="p-8 pt-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
                                        <Play size={32} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">Daily Viral Niches</h3>
                                <p className="text-gray-400">New winning examples updated daily. Don't waste time scrolling; let us curate the hits.</p>
                            </div>
                        </div>

                        {/* Card 2: Niche Analysis */}
                        <div className="group bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden hover:border-green-500/30 transition-all hover:bg-[#1f1f22]">
                            <div className="h-56 overflow-hidden relative">
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                                    <img 
                                        src="public/insight.png" 
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                                        alt="Stats" 
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>
                            </div>
                            <div className="p-8 pt-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                                        <BarChart2 size={32} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">Niche Analysis</h3>
                                <p className="text-gray-400">Deep metric breakdown on viral niches. Saturation, velocity, and monetization potential.</p>
                            </div>
                        </div>

                        {/* Card 3: Niche Categories */}
                        <div className="group bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden hover:border-green-500/30 transition-all hover:bg-[#1f1f22]">
                            <div className="h-56 overflow-hidden relative">
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                                    <img 
                                        src="public/category.png" 
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                                        alt="Categories" 
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>
                            </div>
                            <div className="p-8 pt-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                        <Layers size={32} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">Niche Categories</h3>
                                <p className="text-gray-400">Broken down into 15+ sections including AI, Gaming, Stories, Business, and more.</p>
                            </div>
                        </div>

                        {/* Card 4: Idea Generation */}
                        <div className="group bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden hover:border-green-500/30 transition-all hover:bg-[#1f1f22]">
                            <div className="h-56 overflow-hidden relative">
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                                    <img 
                                        src="public/ideas.png" 
                                        className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" 
                                        alt="Ideas" 
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent"></div>
                            </div>
                            <div className="p-8 pt-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400">
                                        <Lightbulb size={32} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-white">Idea Generation</h3>
                                <p className="text-gray-400">Guiding you not just to copy, but adapt. AI-powered hooks and scripts for every niche.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AD PLACEMENT: MID SECTION */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <AdUnit slot="landing-mid-slot" format="horizontal" />
            </div>

            {/* --- COMPARISON (BEFORE / AFTER) --- */}
            <section className="py-24 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Before vs After</span>
                        <h2 className="text-4xl font-bold mt-4 mb-4">See the difference when trend <br /> research runs on autopilot</h2>
                        <p className="text-gray-400 max-w-xl">NicheTracker replaces time-consuming research with actionable intelligence so your team can ship shorts faster than the feed changes.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        {/* Arrow Connector (Hidden on mobile) */}
                        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="bg-[#09090b] p-2 rounded-full border border-white/10">
                                <ArrowRight className="text-gray-500" />
                            </div>
                        </div>

                        {/* Before */}
                        <div className="bg-[#18181b]/50 border border-white/5 rounded-3xl p-8 hover:bg-red-900/5 transition-colors duration-500 group">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Before NicheTracker</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-gray-400 group-hover:text-gray-300">You spend hours hunting for viral concepts manually.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-gray-400 group-hover:text-gray-300">You are stuck in saturated niches with no fresh ideas.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-gray-400 group-hover:text-gray-300">You're stuck in 1,000 view jail constantly.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-gray-400 group-hover:text-gray-300">You struggle to convert data into content.</span>
                                </li>
                            </ul>
                        </div>

                        {/* After */}
                        <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8 relative overflow-hidden hover:bg-green-500/10 transition-colors duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full"></div>
                            <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-6">After NicheTracker</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-white font-medium">You get daily trend alerts and curated niche ideas.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-white font-medium">You uncover untapped angles before others do.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-white font-medium">Going viral consistently is effortless.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={20} />
                                    <span className="text-white font-medium">You turn ideas into scripts and videos fast.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4">Pricing</div>
                    <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
                    <p className="text-gray-400 mb-8">Choose monthly or yearly. No hidden fees. Cancel anytime.</p>

                    {/* PREMIUM TOGGLE */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-[#18181b] p-1.5 rounded-full inline-flex relative shadow-inner border border-white/5 w-72">
                            {/* Sliding Background */}
                            <div 
                                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#27272a] rounded-full shadow-md transition-all duration-300 ease-in-out ${
                                    billingCycle === 'monthly' ? 'left-1.5' : 'left-[calc(50%+3px)]'
                                }`}
                            ></div>
                            
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`relative z-10 w-1/2 py-2.5 rounded-full text-sm font-bold transition-colors ${
                                    billingCycle === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Monthly
                            </button>
                            <button 
                                onClick={() => setBillingCycle('yearly')}
                                className={`relative z-10 w-1/2 py-2.5 rounded-full text-sm font-bold transition-colors flex items-center justify-between px-3 ${
                                    billingCycle === 'yearly' ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <span>Yearly</span>
                                <span className="bg-green-500 text-black text-[9px] px-1.5 py-0.5 rounded font-extrabold ml-auto">SAVE 58%</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative max-w-md mx-auto">
                        <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="bg-[#18181b] border border-green-500/50 rounded-3xl p-8 relative z-10 shadow-2xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            
                            <div className="inline-block bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-6">BEST VALUE</div>
                            
                            <h3 className="text-2xl font-bold mb-1">{billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</h3>
                            <p className="text-gray-400 text-sm mb-6">Save significantly with annual billing.</p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black text-white">${billingCycle === 'yearly' ? '50' : '10'}</span>
                                <span className="text-gray-400 font-medium">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                            </div>

                            <ul className="text-left space-y-4 mb-8">
                                {[
                                    'Unlimited niche research',
                                    'New niches uploaded daily',
                                    'Access to viral videos',
                                    'NicheTracker score ratings',
                                    'Idea generation',
                                    'Best subniches',
                                    'Niche analysis',
                                    'Cancel anytime'
                                ].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle size={12} className="text-green-500" />
                                        </div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={onViewPricing || onGetStarted}
                                className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:scale-105"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEEDBACK SECTION --- */}
            <section id="feedback" className="py-24 px-6 bg-[#0c0c0e]">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-green-500 font-bold text-xs uppercase tracking-wide">Feedback</span>
                    <h2 className="text-4xl font-bold mt-2 mb-8">Help Us Build Better</h2>
                    
                    <div className="bg-white text-black p-10 rounded-3xl max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-gray-600 mb-6 font-medium">Help us build NicheTracker for creators like you. Fill out this short feedback survey and influence upcoming features.</p>
                            <button className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2 mx-auto">
                                Share Your Feedback <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 relative">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-green-500 font-bold text-sm uppercase tracking-wide">FAQs</span>
                        <h2 className="text-4xl font-bold mt-2">Frequently asked questions</h2>
                        <p className="text-gray-400 mt-2">Still deciding? Here are the most common questions creators ask.</p>
                    </div>

                    <div className="space-y-4">
                        {faqItems.map((item, idx) => {
                            const isOpen = faqOpen === idx;
                            return (
                                <div 
                                    key={idx} 
                                    className={`bg-[#18181b] border ${isOpen ? 'border-green-500/50' : 'border-white/5'} rounded-2xl overflow-hidden transition-all duration-300`}
                                >
                                    <button 
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                                    >
                                        <span className="font-bold text-lg text-white">{item.q}</span>
                                        <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                                            {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                        </div>
                                    </button>
                                    
                                    <div 
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <p className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <footer className="py-12 px-6 border-t border-white/5 bg-[#09090b] text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Zap className="text-black w-3 h-3 fill-current" />
                            </div>
                            <span className="font-bold text-lg">NicheTracker</span>
                        </div>
                        <div className="space-y-1 text-gray-500">
                            <a 
  href="mailto:contact@nichetracker.ai" 
    className="hover:text-green-500"
>
  contact@nichetracker.ai
</a>

                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Tools</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><button onClick={onLogin} className="hover:text-green-500 text-left">Dashboard</button></li>
                                <li><button onClick={onLogin} className="hover:text-green-500 text-left">Subniches</button></li>
                                <li><button onClick={onLogin} className="hover:text-green-500 text-left">Analysis</button></li>
                                <li><button onClick={onLogin} className="hover:text-green-500 text-left">Ideas</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Legal</h4>
                            <ul className="space-y-2 text-gray-500">
                                <li><button onClick={() => onViewLegal && onViewLegal('privacy')} className="hover:text-green-500 text-left">Privacy Policy</button></li>
                                <li><button onClick={() => onViewLegal && onViewLegal('terms')} className="hover:text-green-500 text-left">Terms of service</button></li>
                                <li><button onClick={() => onViewLegal && onViewLegal('refund')} className="hover:text-green-500 text-left">Refund policy</button></li>
                                <li><button onClick={() => onViewLegal && onViewLegal('affiliate')} className="hover:text-green-500 text-left">Affiliate terms</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* FOOTER AD UNIT */}
                <div className="max-w-4xl mx-auto mt-8 mb-4">
                    <AdUnit slot="landing-footer-slot" format="horizontal" />
                </div>

                <div className="max-w-7xl mx-auto mt-4 pt-8 border-t border-white/5 text-gray-600 flex justify-between items-center">
                    <p>© 2025 NicheTracker. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="#" className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-black transition-colors">
                            <TikTokIcon size={14} />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-black transition-colors">
                            <Facebook size={16} />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white hover:text-black transition-colors">
                            <Instagram size={16} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
