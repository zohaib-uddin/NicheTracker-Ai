import React, { useEffect, useState, useMemo } from 'react';
import { NicheData, FilterState, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { NicheCard } from './NicheCard';
import { Loader2, Sparkles, FolderOpen, AlertCircle, FilterX, TrendingUp } from 'lucide-react';
import { AdUnit } from './AdUnit';
import { Pagination } from './Pagination';
import { useSearchParams } from 'react-router-dom';

interface CategoryFeedProps {
    category: string;
    onViewNiche: (niche: NicheData) => void;
    filters: FilterState;
    savedIds?: string[];
    onToggleSave?: (id: string, n: NicheData) => void;
    isAdmin?: boolean; 
    onDelete?: (id: string) => void;
    user?: UserProfile | null;
    onShowUnlock?: () => void;
}

export const CategoryFeed: React.FC<CategoryFeedProps> = ({ 
    category, onViewNiche, filters, savedIds = [], onToggleSave, 
    isAdmin, onDelete, user, onShowUnlock 
}) => {
    const [niches, setNiches] = useState<NicheData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = searchParams.get('page');
    const currentPage = pageParam ? parseInt(pageParam) : 1;
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError('');
            setNiches([]); 
            
            try {
                let dbNiches: NicheData[] = [];
                if (isSupabaseConfigured() && supabase) {
                    try {
                        const { data, error: dbErr } = await supabase
                            .from('niches')
                            .select('*')
                            .order('created_at', { ascending: false });
                        
                        if (!dbErr && data) {
                             dbNiches = data
                                .map(row => ({ ...row.content, _db_id: row.id } as NicheData))
                                .filter(n => n.category && (category.toLowerCase().includes(n.category.toLowerCase()) || n.category?.toLowerCase().includes(category.toLowerCase())));
                        }
                    } catch (e) {
                        console.warn("DB Fetch Error", e);
                    }
                } else {
                    const saved = localStorage.getItem('my_niches');
                    if (saved) {
                        const parsed = JSON.parse(saved) as NicheData[];
                        dbNiches = parsed.filter(n => n.category && (category.toLowerCase().includes(n.category.toLowerCase()) || n.category.toLowerCase().includes(category.toLowerCase())));
                    }
                }
                setNiches(dbNiches);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch database videos.");
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            loadData();
            // Reset to page 1 if changing categories (unless URL already has page)
            if (!pageParam) setSearchParams({ page: '1' });
        }
    }, [category]);

    const handleLocalDelete = (id: string) => {
        setNiches(prev => prev.filter(n => n.id !== id));
        if (onDelete) onDelete(id);
    };

    const filteredNiches = useMemo(() => {
        const results = niches.filter(n => {
            if (filters.platform !== 'All' && n.video_platform !== filters.platform) return false;
            const now = Date.now();
            const createTimeMs = (n.create_time || 0) * 1000;
            if (filters.timeRange === '7d' && (now - createTimeMs) > (7 * 86400000)) return false;
            if (filters.timeRange === '30d' && (now - createTimeMs) > (30 * 86400000)) return false;

            const getNum = (val: string | number | undefined) => {
                 if (!val) return 0;
                 if (typeof val === 'number') return val;
                 const s = val.toString().toUpperCase().replace(/,/g, '');
                 if (s.includes('M')) return parseFloat(s) * 1000000;
                 if (s.includes('K')) return parseFloat(s) * 1000;
                 return parseFloat(s) || 0;
            };
            const views = getNum(n.views);
            const followers = n.author_stats ? n.author_stats.followers : 0;

            if (filters.minViews && views < parseInt(filters.minViews)) return false;
            if (filters.maxViews && views > parseInt(filters.maxViews)) return false;
            if (filters.minFollowers && followers < parseInt(filters.minFollowers)) return false;
            if (filters.maxFollowers && followers > parseInt(filters.maxFollowers)) return false;
            if (filters.dateAfter && createTimeMs < new Date(filters.dateAfter).getTime()) return false;
            if (filters.dateBefore && createTimeMs > (new Date(filters.dateBefore).getTime() + 86400000)) return false;
            return true;
        });
        return results.sort((a, b) => (b.create_time || 0) - (a.create_time || 0));
    }, [niches, filters]);

    const totalPages = Math.ceil(filteredNiches.length / ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setSearchParams({ page: page.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const paginatedNiches = filteredNiches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // --- GRID AD INJECTION LOGIC ---
    // Inject 4 AdSlots after every row of 4 video cards
    const gridItems = useMemo(() => {
        const items: (NicheData | 'ad')[] = [];
        paginatedNiches.forEach((n, idx) => {
            items.push(n);
            if ((idx + 1) % 4 === 0) {
                for (let i = 0; i < 4; i++) {
                    items.push('ad');
                }
            }
        });
        return items;
    }, [paginatedNiches]);

    const getDynamicSubtitle = () => {
        const platformText = filters.platform === 'All' ? 'All Platforms' : filters.platform;
        let timeText = 'All Time';

        if (filters.dateAfter && filters.dateBefore) {
            const start = new Date(filters.dateAfter).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
            const end = new Date(filters.dateBefore).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
            timeText = `${start} – ${end}`;
        } else if (filters.timeRange === '7d') {
            timeText = 'Last 7 days';
        } else if (filters.timeRange === '30d') {
            timeText = 'Last 30 days';
        }

        return `${category} · ${platformText} · ${timeText}`;
    };

    const getThemeColor = () => {
        if (category.includes('AI') || category.includes('Business')) return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
        if (category.includes('Gaming')) return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
        if (category.includes('Horror')) return 'text-red-400 border-red-500/20 bg-red-500/10';
        if (category.includes('Motivation')) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
        if (category.includes('Geo')) return 'text-green-400 border-green-500/20 bg-green-500/10';
        return 'text-primary border-primary/20 bg-primary/10';
    };
    const themeClass = getThemeColor();

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground">{category} Collection</h1>
                        {/* TRENDING BADGE */}
                        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <TrendingUp size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Trending</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted font-medium">{getDynamicSubtitle()}</p>
                </div>
                <div className="text-sm text-muted font-medium bg-surface px-4 py-2 rounded-lg border border-border">
                    {loading ? 'Updating...' : `${filteredNiches.length} Active Candidates`}
                </div>
            </div>

            <AdUnit slot="category-top-slot" format="horizontal" />

            {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle size={20} />{error}</div>}
            
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <div className="relative"><div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div><Loader2 size={48} className={`animate-spin ${themeClass.split(' ')[0]}`} /></div>
                    <p className="text-muted text-sm font-mono animate-pulse">Loading {category} Niches...</p>
                </div>
            ) : (
                <>
                {filteredNiches.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {gridItems.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {item === 'ad' ? (
                                        <div className="aspect-[9/16] bg-surface border border-dashed border-border rounded-2xl flex items-center justify-center overflow-hidden">
                                            <AdUnit slot={`feed-ad-${idx}`} format="rectangle" label="Ad Slot" className="m-0" />
                                        </div>
                                    ) : (
                                        <>
                                            <NicheCard 
                                                data={item} 
                                                onClick={() => onViewNiche(item)}
                                                isSaved={savedIds.includes(item.id)}
                                                onToggleSave={onToggleSave}
                                                isAdmin={isAdmin}
                                                onDelete={handleLocalDelete} 
                                            />
                                            <div className="mt-3 px-1">
                                                <div className="flex items-center gap-2 text-xs text-muted mb-1"><Sparkles size={12} className={themeClass.split(' ')[0]} /> AI Insight</div>
                                                <p className="text-xs text-muted leading-relaxed line-clamp-2 italic">"{item.description || "Analyzing niche performance..."}"</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* PAGINATION CONTROL (NEXT, PREVIOUS, NUMBERS) */}
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                        
                        <AdUnit slot="category-bottom-slot" format="horizontal" />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border rounded-3xl bg-surface/50">
                        <div className="p-4 bg-surface border border-border rounded-full shadow-xl mb-4">{niches.length > 0 ? <FilterX size={32} className="text-muted" /> : <FolderOpen size={32} className="text-muted" />}</div>
                        <h3 className="text-lg font-bold text-foreground">{niches.length > 0 ? "No matches found" : `No Videos in ${category}`}</h3>
                        <p className="text-muted text-sm max-w-xs mt-1">{niches.length > 0 ? "Try adjusting your filters to see more results." : `This feed is empty. Go to Add Video to populate this category.`}</p>
                    </div>
                )}
                </>
            )}
        </div>
    );
};