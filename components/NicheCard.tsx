
import React, { useState, useEffect, useRef } from 'react';
import { NicheCardProps, NicheData } from '../types';
import { fetchVideoStatsOnly, getCachedData, updateCache } from '../services/geminiService';
import { 
  TrendingUp, Heart, MessageCircle, Share2, 
  Volume2, VolumeX, ExternalLink, Play, Eye, Clock, RefreshCw, Bookmark, Trash2
} from 'lucide-react';

export const NicheCard: React.FC<NicheCardProps> = ({ data, onClick, isSaved, onToggleSave, isAdmin, onDelete }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Real-Time Stats Local State
  const cached = data.video_id ? getCachedData(data.video_id) : null;
  const initialStats = cached ? {
      views: cached.views,
      likes: cached.engagement.likes,
      comments: cached.engagement.comments,
      shares: cached.engagement.shares,
      create_time: cached.create_time,
      video_url: (cached as any).video_url,
      cover_url: cached.cover_url,
      channel_avatar_url: cached.channel_avatar_url 
  } : {
      views: data.views,
      likes: data.engagement.likes,
      comments: data.engagement.comments,
      shares: data.engagement.shares,
      create_time: data.create_time,
      video_url: (data as any).video_url,
      cover_url: data.cover_url,
      channel_avatar_url: data.channel_avatar_url
  };

  const [liveStats, setLiveStats] = useState(initialStats);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- SAVE TOGGLE HANDLER ---
  const handleSaveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onToggleSave) {
          onToggleSave(data.id, data);
      }
  };

  // --- ADMIN DELETE HANDLER ---
  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Direct delete without confirmation as requested
      if (onDelete) {
          onDelete(data.id);
      }
  };

  const formatStat = (val: string | number | undefined) => {
    if (val === undefined || val === null) return "0";
    let num: number;
    if (typeof val === 'number') num = val;
    else {
        const cleanStr = val.toString().replace(/,/g, '');
        if (cleanStr.toUpperCase().includes('M')) return cleanStr; 
        if (cleanStr.toUpperCase().includes('K')) return cleanStr; 
        num = parseFloat(cleanStr);
    }
    if (isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  const parseCount = (val: string | number | undefined): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const str = val.toString().replace(/,/g, '');
      const multiplier = str.toUpperCase().includes('M') ? 1000000 : str.toUpperCase().includes('K') ? 1000 : 1;
      return parseFloat(str.replace(/[^0-9.]/g, '')) * multiplier || 0;
  };

  useEffect(() => {
    let interval: any;
    const fetchLiveStats = async () => {
        if (data.video_platform !== 'TikTok' || !data.video_id || !data.channel_handle) return;
        setIsUpdating(true); 
        try {
            const videoUrl = `https://www.tiktok.com/@${data.channel_handle.replace('@', '')}/video/${data.video_id}`;
            const freshStats = await fetchVideoStatsOnly(videoUrl);
            if (freshStats) {
                const fullUpdatedData = { ...data, ...freshStats };
                if(data.video_id) updateCache(data.video_id, fullUpdatedData as any);
                setLiveStats({
                    views: freshStats.views || "0",
                    likes: freshStats.engagement?.likes || "0",
                    comments: freshStats.engagement?.comments || "0",
                    shares: freshStats.engagement?.shares || "0",
                    create_time: freshStats.create_time || data.create_time,
                    video_url: (freshStats as any).video_url || liveStats.video_url,
                    cover_url: freshStats.cover_url || liveStats.cover_url,
                    channel_avatar_url: freshStats.channel_avatar_url || liveStats.channel_avatar_url
                });
            }
        } catch (e) { console.warn("Card sync failed", e); } finally { setIsUpdating(false); }
    };
    const delay = Math.random() * 1000;
    const timeout = setTimeout(() => { fetchLiveStats(); }, delay);
    interval = setInterval(fetchLiveStats, 60000); 
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [data.video_id, data.channel_handle, data.video_platform]);

  useEffect(() => {
    const calculateTimeAgo = () => {
        const timestamp = liveStats.create_time || data.create_time;
        if (!timestamp) { setTimeAgo('Recently'); return; }
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        if (diff < 60) setTimeAgo('Just now');
        else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`);
        else if (diff < 86400) setTimeAgo(`${Math.floor(diff / 3600)}h ago`);
        else if (diff < 604800) setTimeAgo(`${Math.floor(diff / 86400)}d ago`);
        else if (diff < 2592000) setTimeAgo(`${Math.floor(diff / 604800)}w ago`);
        else setTimeAgo(`${Math.floor(diff / 2592000)}mo ago`);
    };
    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [liveStats.create_time, data.create_time]);

  const cleanId = (data.video_id || '').match(/(\d{15,25})/) ? data.video_id : '';
  const isTikTok = data.video_platform === 'TikTok';
  let embedUrl = isTikTok 
    ? `https://www.tiktok.com/embed/v2/${cleanId}?lang=en-US&embedFrom=oembed`
    : `https://www.youtube.com/embed/${cleanId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&loop=1&playlist=${cleanId}&playsinline=1&showinfo=0&rel=0&modestbranding=1&enablejsapi=1`;

  const handle = data.channel_handle ? data.channel_handle.replace('@', '') : data.channel_name.replace(/\s/g, '');
  const profileUrl = isTikTok ? `https://www.tiktok.com/@${handle}` : `https://www.youtube.com/@${handle}`;
  const videoUrl = isTikTok ? `https://www.tiktok.com/@${handle}/video/${cleanId}` : `https://www.youtube.com/watch?v=${cleanId}`;

  const handleExternalClick = (e: React.MouseEvent, url: string) => { e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer'); };
  const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      if (videoRef.current) {
          if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); } 
          else { videoRef.current.play(); setIsPlaying(true); }
      }
  };

  const cleanVideoUrl = liveStats.video_url || (data as any).video_url;
  const coverUrl = liveStats.cover_url || data.cover_url;
  const realAvatarUrl = liveStats.channel_avatar_url || data.channel_avatar_url;
  
  const viewsVal = parseCount(liveStats.views);
  const postTime = liveStats.create_time || Date.now()/1000;
  const hoursAlive = Math.max(0.1, (Date.now()/1000 - postTime) / 3600);
  const growthPercentage = Math.min(999, ((viewsVal / hoursAlive) / 1000)).toFixed(1);

  // TikTok Icon SVG
  const TikTokIcon = ({ size = 12, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  return (
    <div 
      onClick={() => {
        const freshData = {
             ...data,
             views: String(liveStats.views),
             engagement: {
                 likes: String(liveStats.likes),
                 comments: String(liveStats.comments),
                 shares: String(liveStats.shares)
             },
             create_time: liveStats.create_time,
             video_url: cleanVideoUrl,
             cover_url: coverUrl,
             channel_avatar_url: realAvatarUrl 
        };
        onClick();
      }}
      className="group bg-surface border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col aspect-[9/16] relative"
    >
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className={`absolute inset-0 w-full h-full`}> 
          {isTikTok && cleanVideoUrl ? (
              <>
                <video 
                    ref={videoRef} src={cleanVideoUrl} className="w-full h-full object-cover" poster={coverUrl} 
                    loop muted={isMuted} playsInline {...{ referrerPolicy: "no-referrer" } as any} onClick={togglePlay}
                />
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors z-10 pointer-events-none">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center pl-1 border border-white/30 shadow-2xl scale-100 transition-transform">
                            <Play size={32} className="text-white fill-white" />
                        </div>
                    </div>
                )}
              </>
          ) : cleanId ? (
              <iframe key={`${cleanId}-${isMuted}`} src={embedUrl} title={data.title} className={`w-full h-full object-cover ${!isTikTok ? 'scale-[1.35] origin-center' : ''}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" sandbox={isTikTok ? "allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin allow-forms" : undefined}></iframe>
          ) : <div className="flex items-center justify-center h-full text-muted">Video unavailable</div>}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none"></div>

        {/* --- ADMIN DELETE BUTTON (HOVER ONLY) --- */}
        {isAdmin && (
            <button 
                onClick={handleDeleteClick}
                className="absolute top-3 right-3 z-30 w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 pointer-events-auto"
                title="Permanently Delete Video"
            >
                <Trash2 size={12} />
            </button>
        )}

        {/* --- TOP BAR (SMALLER) --- */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20 pointer-events-auto">
          {/* Top Left: Category */}
          <div className="bg-primary/90 backdrop-blur-sm border border-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wide cursor-pointer hover:bg-primary transition-colors shadow-sm">
               {data.category}
          </div>

          {/* Top Right: Trending + TikTok Icon */}
          <div className="flex items-center gap-1.5">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <TrendingUp size={10} className="text-green-400" /> +{growthPercentage}%
              </div>
              <div 
                className="bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" 
                onClick={(e) => handleExternalClick(e, videoUrl)}
              >
                 <TikTokIcon size={10} className="text-white" />
              </div>
          </div>
        </div>

        {/* Mute Button (Smaller) */}
        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute top-10 right-3 z-20 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all pointer-events-auto hover:scale-110">
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>

        {/* Save Button (Smaller) */}
        <button 
            onClick={handleSaveClick}
            className={`absolute top-20 right-3 z-20 p-1.5 rounded-full backdrop-blur-md border transition-all pointer-events-auto hover:scale-110 ${
                isSaved 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                : 'bg-black/40 text-white/70 border-white/10 hover:text-white hover:bg-black/60'
            }`}
            title={isSaved ? "Unsave Video" : "Save Video"}
        >
            {isSaved ? <Bookmark size={12} fill="currentColor" /> : <Bookmark size={12} />}
        </button>
        
        {/* Right Side Stats (Smaller) */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-2 z-10 pointer-events-auto">
            <div className="flex flex-col items-center gap-0.5 group/icon">
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full group-hover/icon:bg-white/20 transition-colors border border-white/5 shadow-lg"><Heart size={14} className="text-white fill-white/20" /></div>
                <span className="text-[9px] font-bold text-white shadow-black drop-shadow-md">{formatStat(liveStats.likes)}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 group/icon">
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full group-hover/icon:bg-white/20 transition-colors border border-white/5 shadow-lg"><MessageCircle size={14} className="text-white fill-white/20" /></div>
                <span className="text-[9px] font-bold text-white shadow-black drop-shadow-md">{formatStat(liveStats.comments)}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 group/icon cursor-pointer" onClick={(e) => handleExternalClick(e, videoUrl)}>
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full group-hover/icon:bg-white/20 transition-colors border border-white/5 shadow-lg"><Share2 size={14} className="text-white fill-white/20" /></div>
                <span className="text-[9px] font-bold text-white shadow-black drop-shadow-md">{formatStat(liveStats.shares)}</span>
            </div>
        </div>

        {/* Bottom Info Area */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-10">
          <div className="flex items-center gap-2 mb-2 cursor-pointer group/channel w-fit" onClick={(e) => handleExternalClick(e, profileUrl)}>
            {realAvatarUrl && !imageError ? (
                <img src={realAvatarUrl} alt={data.channel_name} className="w-8 h-8 rounded-full border border-white/20 shadow-md object-cover bg-gray-800" onError={() => setImageError(true)} />
            ) : (
                <div className={`w-8 h-8 rounded-full border border-white/20 shadow-md flex items-center justify-center text-[8px] font-bold text-white uppercase bg-gradient-to-tr from-[#25F4EE] to-[#FE2C55]`}>{data.channel_name.substring(0, 2).toUpperCase()}</div>
            )}
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white shadow-black drop-shadow-md truncate group-hover/channel:underline flex items-center gap-1">
                   {data.channel_name}
                   <div className="bg-blue-500 rounded-full p-[1px] flex items-center justify-center w-3 h-3"><svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                </span>
                <div className="flex items-center gap-2 text-[9px] text-gray-300 font-medium">
                    <span className="flex items-center gap-1"><Eye size={9} /> {formatStat(liveStats.views)} {isUpdating && <RefreshCw size={8} className="animate-spin text-primary ml-1" />}</span>
                    <span className="w-0.5 h-0.5 bg-gray-400 rounded-full"></span>
                    <span className="flex items-center gap-1"><Clock size={9} /> {timeAgo}</span>
                </div>
            </div>
          </div>
          
          <div className="cursor-pointer pr-10" onClick={(e) => handleExternalClick(e, videoUrl)}>
            <h3 className="text-white font-bold text-xs leading-snug line-clamp-2 shadow-black drop-shadow-md mb-1 hover:text-primary transition-colors">{data.title}</h3>
            {data.keywords && data.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 opacity-90">
                    {data.keywords.slice(0, 2).map((kw, i) => (<span key={i} className="text-[9px] font-bold text-blue-300">#{kw.replace(/^#/, '').replace(/\s/g, '')}</span>))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
