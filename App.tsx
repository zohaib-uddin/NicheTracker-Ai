
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet, useSearchParams, useParams } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NicheCard } from './components/NicheCard';
import { StatsOverview } from './components/StatsOverview';
import { AddVideoPage } from './components/AddVideoPage';
import { NicheDetailPage } from './components/NicheDetailPage';
import { MonetizationChecker } from './components/MonetizationChecker';
import { Discovery } from './components/Discovery';
import { SavedNiches } from './components/SavedNiches';
import { AccountProfile } from './components/AccountProfile';
import { Settings } from './components/Settings';
import { CategoryFeed } from './components/CategoryFeed';
import { AuthPage } from './components/AuthPage';
import { PaymentPage } from './components/PaymentPage';
import { UnlockModal } from './components/UnlockModal';
import { LandingPage } from './components/LandingPage'; 
import { LegalPage } from './components/LegalPage'; 
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { NicheData, NavItem, FilterState, UserProfile } from './types';
import { Loader2, Sparkles, FolderOpen } from 'lucide-react';
import { Pagination } from './components/Pagination';
import { AdUnit } from './components/AdUnit';

const TRANSLATIONS: Record<string, Record<string, string>> = {
    'en-US': { 'Dashboard': 'Dashboard', 'Saved': 'Saved', 'Search...': 'Search...', 'My Viral Dashboard': 'Creator Growth Dashboard' },
    'es': { 'Dashboard': 'Panel', 'Saved': 'Guardado', 'Search...': 'Buscar...', 'My Viral Dashboard': 'Mi Panel Viral' },
    'fr': { 'Dashboard': 'Tableau de bord', 'Saved': 'Sauvegardé', 'Search...': 'Rechercher...', 'My Viral Dashboard': 'Mon Tableau Viral' },
};

const ADMIN_EMAIL = "zohaibuddin376@gmail.com";
const RESET_VERSION = "2026-OPTIMISTIC-RESET-V12"; 

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const [manualNiches, setManualNiches] = useState<NicheData[]>([]);
  const [apiNiches, setApiNiches] = useState<NicheData[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  
  const [savedNicheIds, setSavedNicheIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
      platform: 'All',
      timeRange: '30d',
      minViews: '',
      maxViews: '',
      minFollowers: '',
      maxFollowers: '',
      dateAfter: '',
      dateBefore: ''
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [appLanguage, setAppLanguage] = useState('en-US');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) { document.documentElement.classList.add('dark'); setIsDarkMode(true); } 
    else { document.documentElement.classList.remove('dark'); setIsDarkMode(false); }

    const storedLang = localStorage.getItem('app_language');
    if(storedLang) setAppLanguage(storedLang);

    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if(session) fetchUserProfile(session);
            else setAuthLoading(false);
        }).catch(err => {
            console.error("Auth Session Error:", err);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if(session) {
                fetchUserProfile(session);
            } else { 
                setUserProfile(null); 
                setSavedNicheIds([]);
                setManualNiches([]); 
                setAuthLoading(false); 
            }
        });
        return () => subscription.unsubscribe();
    } else {
        setAuthLoading(false);
    }
  }, []);

  const calculateFreshUsage = (currentUsage: any) => {
      const today = new Date().toDateString();
      const isNewDay = currentUsage.last_reset !== today;
      const isNewVersion = currentUsage.reset_version !== RESET_VERSION;
      
      if (isNewDay || isNewVersion) {
          return {
              ...currentUsage,
              ai_analysis_used: 0, 
              monetization_checks_used: 0, 
              last_reset: today,
              reset_version: RESET_VERSION
          };
      }
      return currentUsage;
  };

  const handleConsumeCredit = async (type: 'ai' | 'monetization') => {
      if (!userProfile) return;
      const currentUsage = userProfile.usage || { 
          ai_analysis_used: 0, 
          monetization_checks_used: 0, 
          tracked_niches: 0, 
          last_reset: new Date().toDateString(),
          reset_version: RESET_VERSION 
      };
      const freshUsage = calculateFreshUsage(currentUsage);
      if (type === 'ai') freshUsage.ai_analysis_used += 1;
      if (type === 'monetization') freshUsage.monetization_checks_used += 1;
      freshUsage.last_reset = new Date().toDateString();
      freshUsage.reset_version = RESET_VERSION;
      const updatedProfile = { ...userProfile, usage: freshUsage };
      setUserProfile(updatedProfile);
      if (supabase) {
          try {
              await supabase.auth.updateUser({ data: { usage: freshUsage } });
              await supabase.from('users').update({ usage: freshUsage }).eq('id', userProfile.id);
          } catch(e) { console.error("Credit sync failed:", e); }
      }
  };

  const fetchUserProfile = async (sessionData: any) => {
      if(!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user || sessionData?.user;
      if (!currentUser) return;
      
      const userId = currentUser.id;
      const meta = currentUser.user_metadata || {};
      const authCreatedAt = currentUser.created_at || new Date().toISOString();
      const isAdmin = currentUser.email === ADMIN_EMAIL;

      try {
          const { data } = await supabase.from('users').select('*').eq('id', userId).single();
          if(data) {
              const freshUsage = calculateFreshUsage(data.usage || {});
              const updatedProfile = {
                  ...data,
                  usage: freshUsage,
                  is_pro: isAdmin || data.is_pro,
                  is_admin: isAdmin,
              };
              setUserProfile(updatedProfile); 
              fetchNichesAndUserSaves(userId);
          } else {
              const initialUsage = { ai_analysis_used: 0, monetization_checks_used: 0, tracked_niches: 0, last_reset: new Date().toDateString(), reset_version: RESET_VERSION };
              const newProfile = { id: userId, email: currentUser.email, full_name: meta.full_name, joined_at: authCreatedAt, usage: initialUsage, is_admin: isAdmin };
              await supabase.from('users').insert([newProfile]);
              setUserProfile(newProfile as any);
              fetchNichesAndUserSaves(userId);
          }
      } catch (e: any) {
          console.warn("User fetch error", e);
          fetchNichesAndUserSaves(userId);
      } finally {
          setAuthLoading(false);
      }
  };

  const fetchNichesAndUserSaves = async (userId: string) => {
    setDbLoading(true);
    if (isSupabaseConfigured() && supabase) {
        try {
            const { data: globalData } = await supabase.from('niches').select('*').order('created_at', { ascending: false });
            const { data: savedData } = await supabase.from('saved_niches').select('*').eq('user_id', userId);
            const mySavedIds = savedData ? savedData.map((row: any) => row.niche_id) : [];
            setSavedNicheIds(mySavedIds);
            const combinedMap = new Map();
            if (globalData) {
                globalData.forEach(row => {
                    if(row.content && row.content.id) {
                        combinedMap.set(row.content.id, { ...row.content, _db_id: row.id });
                    }
                });
            }
            if (savedData) {
                savedData.forEach(row => {
                    if(row.niche_data && row.niche_data.id) {
                        combinedMap.set(row.niche_data.id, row.niche_data);
                    }
                });
            }
            setManualNiches(Array.from(combinedMap.values()));
        } catch (err: any) { console.warn("Sync Error", err); }
    }
    setDbLoading(false);
  };

  const handleToggleSave = async (id: string, nicheData?: NicheData) => {
      if (!userProfile || !supabase) {
          alert("Please login to save niches.");
          return;
      }
      const isSaved = savedNicheIds.includes(id);
      let newIds = isSaved ? savedNicheIds.filter(sid => sid !== id) : [...savedNicheIds, id];
      setSavedNicheIds(newIds);
      try {
          if (isSaved) {
              await supabase.from('saved_niches').delete().eq('user_id', userProfile.id).eq('niche_id', id);
          } else {
              if (nicheData) {
                  await supabase.from('saved_niches').insert({
                      user_id: userProfile.id,
                      niche_id: id,
                      niche_data: nicheData
                  });
              }
          }
      } catch (e) {
          setSavedNicheIds(savedNicheIds); 
      }
  };

  const handleAddNiche = async (niche: NicheData, preventRedirect: boolean = false) => {
    setManualNiches(prev => [niche, ...prev]);
    if (!preventRedirect) navigate('/dashboard');
    if (supabase) {
        try { await supabase.from('niches').insert([{ content: niche }]); } 
        catch (err: any) { console.error("Insert error", err); }
    }
  };

  const handleDeleteNiche = async (id: string) => {
      if (!userProfile?.is_admin) return;
      setManualNiches(prev => prev.filter(n => n.id !== id));
      if (supabase) {
          try { await supabase.from('niches').delete().eq('content->>id', id); } 
          catch (e) { console.error("Delete error", e); }
      }
  };

  const handleLogout = async () => {
      if(supabase) await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
      setSavedNicheIds([]);
      setManualNiches([]); 
      navigate('/');
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-[#09090b] text-white"><Loader2 className="animate-spin text-green-500" size={48} /></div>;

  // --- INTERNAL COMPONENT FOR DASHBOARD VIEW TO HANDLE URL STATE ---
  const DashboardView = () => {
      const [searchParams, setSearchParams] = useSearchParams();
      const pageParam = searchParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      const ITEMS_PER_PAGE = 20;

      const filteredNiches = useMemo(() => {
        const allNiches = [...manualNiches, ...apiNiches];
        const uniqueNiches = Array.from(new Map(allNiches.map(item => [item.id, item])).values());
        const results = uniqueNiches.filter(n => {
            if (filters.platform !== 'All' && n.video_platform !== filters.platform) return false;
            const now = Date.now();
            const createTimeMs = (n.create_time || 0) * 1000;
            if (filters.timeRange === '7d' && (now - createTimeMs) > (7 * 86400000)) return false;
            if (filters.timeRange === '30d' && (now - createTimeMs) > (30 * 86400000)) return false;
            const getNum = (val: any) => {
                 if (!val) return 0;
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
      }, [manualNiches, apiNiches, filters]);

      const totalPages = Math.ceil(filteredNiches.length / ITEMS_PER_PAGE);
      const freeUserDefaultPage = Math.max(1, Math.ceil(totalPages / 2));

      // Redirect if page is invalid for user type (simple check)
      useEffect(() => {
          if (!userProfile?.is_pro && !userProfile?.is_admin && currentPage !== 1 && currentPage < freeUserDefaultPage) {
              // Allow page 1 always, otherwise restrict
              // NOTE: This logic mimics the previous state logic but for URLs it's trickier.
              // For simplicity in routing, we just warn or handle in pagination click.
          }
      }, [currentPage, userProfile, totalPages]);

      const handlePageChange = (page: number) => {
          if (userProfile?.is_pro || userProfile?.is_admin || page === freeUserDefaultPage) {
              setSearchParams({ page: page.toString() });
              window.scrollTo({ top: 0, behavior: 'smooth' });
          } else { setIsUnlockModalOpen(true); }
      };

      const paginatedNiches = filteredNiches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

      const dashboardGridItems = useMemo(() => {
        const items: (NicheData | 'ad')[] = [];
        let videoIdx = 0;
        let slotIdx = 0;
        
        while (videoIdx < paginatedNiches.length) {
            const rowIndex = Math.floor(slotIdx / 4);
            const isAdRow = rowIndex % 2 === 1; 
            const isLastSlotInRow = slotIdx % 4 === 3;

            if (isAdRow && isLastSlotInRow) {
                items.push('ad');
            } else {
                items.push(paginatedNiches[videoIdx]);
                videoIdx++;
            }
            slotIdx++;
        }
        return items;
      }, [paginatedNiches]);

      const t = (key: string) => TRANSLATIONS[appLanguage]?.[key] || key;

      const getDashboardSubtitle = () => {
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
          return `Across all niches · ${platformText} · ${timeText}`;
      };

      return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-gray-500">{t('My Viral Dashboard')}</h1>
                <p className="text-muted mt-2 flex items-center gap-2 text-sm md:text-base"><Sparkles size={16} className="text-primary" /> Tracking {manualNiches.length}  Niches.</p>
            </div>
          </div>
          <StatsOverview 
            niches={manualNiches} 
            onCategoryClick={(cat) => { 
                if(userProfile?.is_pro || userProfile?.is_admin) navigate(`/category/${encodeURIComponent(cat)}`);
                else setIsUnlockModalOpen(true); 
            }} 
          />
          <AdUnit slot="dashboard-mid-slot" format="horizontal" />
          <div className="mt-8 mb-2 border-b border-border pb-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Top Trending Videos</h2>
              <p className="text-sm text-muted mt-1 font-medium">{getDashboardSubtitle()}</p>
          </div>
          {(loading || dbLoading) && <div className="flex flex-col items-center justify-center py-12 space-y-4"><Loader2 size={48} className="animate-spin text-primary" /><p className="text-muted">Load Niches</p></div>}
          {!loading && !dbLoading && filteredNiches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[40vh] space-y-4 text-center m-4">
              <div className="p-4 bg-surface rounded-full shadow-lg border border-border"><FolderOpen size={32} className="text-muted" /></div>
              <div className="space-y-1"><h3 className="text-lg font-semibold text-foreground">No videos found.</h3></div>
            </div>
          ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-4">
                {dashboardGridItems.map((item, idx) => (
                    <div key={item === 'ad' ? `dash-ad-slot-${idx}` : item.id} className="relative">
                        {item === 'ad' ? (
                            <div className="aspect-[9/16] bg-surface border border-dashed border-border rounded-2xl flex items-center justify-center overflow-hidden">
                                <AdUnit slot={`dash-ad-${idx}`} format="rectangle" label="Ad Slot" className="m-0" />
                            </div>
                        ) : (
                            <NicheCard 
                                data={item} 
                                onClick={() => navigate(`/niche/${item.id}`)} 
                                isSaved={savedNicheIds.includes(item.id)} 
                                onToggleSave={handleToggleSave} 
                                isAdmin={userProfile?.is_admin} 
                                onDelete={handleDeleteNiche} 
                            />
                        )}
                    </div>
                ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
          <AdUnit slot="dashboard-bottom-slot" format="horizontal" />
        </div>
      );
  };

  // --- INTERNAL COMPONENT TO HANDLE NICHE DETAIL LOOKUP ---
  const NicheDetailWrapper = () => {
      const { id } = useParams();
      const navigate = useNavigate();
      const niche = [...manualNiches, ...apiNiches].find(v => v.id === id);
      
      if (!niche) return <div className="flex items-center justify-center h-full text-muted">Video not found or deleted.</div>;
      
      return (
        <NicheDetailPage 
            niche={niche} 
            allNiches={[...manualNiches, ...apiNiches]} 
            onBack={() => navigate(-1)} 
            user={userProfile} 
            onConsumeCredit={handleConsumeCredit} 
            savedIds={savedNicheIds} 
            onToggleSave={handleToggleSave} 
            onDelete={(id) => { handleDeleteNiche(id); navigate('/dashboard'); }} 
        />
      );
  };

  // --- LAYOUT COMPONENT ---
  const MainLayout = () => {
      // Determine active nav from location.pathname
      const path = location.pathname;
      let activeNav = NavItem.DASHBOARD;
      if (path.includes('/saved')) activeNav = NavItem.SAVED;
      else if (path.includes('/discovery')) activeNav = NavItem.DISCOVERY;
      else if (path.includes('/account')) activeNav = NavItem.ACCOUNT;
      else if (path.includes('/settings')) activeNav = NavItem.SETTINGS;
      else if (path.includes('/add-video')) activeNav = NavItem.ADD_VIDEO;
      else if (path.includes('/monetization')) activeNav = NavItem.MONETIZATION;
      else if (path.includes('/category')) activeNav = NavItem.CATEGORY;
      else if (path.includes('/payment')) activeNav = NavItem.PAYMENT;
      
      // Determine active category for sidebar highlight
      const { category } = useParams();

      return (
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
          <div className="w-0 md:w-64 flex-shrink-0 z-50 md:z-30 relative">
            <Sidebar 
                activeNav={activeNav} 
                activeCategory={category ? decodeURIComponent(category) : undefined} 
                onNavigate={(item) => {
                    // Map NavItem enum to paths
                    switch(item) {
                        case NavItem.DASHBOARD: navigate('/dashboard'); break;
                        case NavItem.SAVED: navigate('/saved'); break;
                        case NavItem.ACCOUNT: navigate('/account'); break;
                        case NavItem.SETTINGS: navigate('/settings'); break;
                        case NavItem.DISCOVERY: navigate('/discovery'); break;
                        case NavItem.ADD_VIDEO: navigate('/add-video'); break;
                        case NavItem.MONETIZATION: navigate('/monetization'); break;
                        case NavItem.PAYMENT: navigate('/payment'); break;
                        default: navigate('/dashboard');
                    }
                }} 
                onSelectCategory={(cat) => navigate(`/category/${encodeURIComponent(cat)}`)} 
                isPro={!!userProfile?.is_pro} 
                isAdmin={!!userProfile?.is_admin} 
                onShowUnlock={() => setIsUnlockModalOpen(true)} 
                mobileOpen={mobileMenuOpen} 
                onMobileClose={() => setMobileMenuOpen(false)} 
            />
          </div>
          <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
            <Header 
                activeNav={activeNav} 
                onNavigate={(item) => {
                    if (item === NavItem.DASHBOARD) navigate('/dashboard');
                    if (item === NavItem.SAVED) navigate('/saved');
                    if (item === NavItem.ACCOUNT) navigate('/account');
                    if (item === NavItem.SETTINGS) navigate('/settings');
                    if (item === NavItem.PAYMENT) navigate('/payment');
                }} 
                filters={filters} 
                onFilterChange={setFilters} 
                onThemeToggle={() => { 
                    if (isDarkMode) { document.documentElement.classList.remove('dark'); setIsDarkMode(false); } 
                    else { document.documentElement.classList.add('dark'); setIsDarkMode(true); } 
                }} 
                isDarkMode={isDarkMode} 
                user={userProfile} 
                onLogout={handleLogout} 
                language={appLanguage} 
                translations={TRANSLATIONS[appLanguage]} 
                onMobileMenuToggle={() => setMobileMenuOpen(prev => !prev)} 
            />
            <main className="flex-1 p-4 md:p-8 w-full overflow-x-hidden">
                <Outlet />
            </main>
          </div>
          {isUnlockModalOpen && <UnlockModal onClose={() => setIsUnlockModalOpen(false)} onUpgrade={() => { setIsUnlockModalOpen(false); navigate('/payment'); }} />}
        </div>
      );
  };

  return (
    <Routes>
        {/* PUBLIC ROUTES */}
        {/* MODIFIED: Landing page is now accessible even if logged in. 
            Passed onGetStarted/onLogin to redirect to dashboard if session exists. */}
        <Route path="/" element={<LandingPage 
            isLoggedIn={!!session}
            onGetStarted={() => session ? navigate('/dashboard') : navigate('/auth/register')} 
            onLogin={() => session ? navigate('/dashboard') : navigate('/auth/login')} 
            onViewPricing={() => session ? navigate('/payment') : navigate('/auth/login')}
            onViewLegal={(t) => navigate(`/legal/${t}`)} 
        />} />
        
        {/* AUTH ROUTES */}
        <Route path="/auth/login" element={!session ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/auth/register" element={!session ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
        
        {/* Redirect Legacy Login Path */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />

        <Route path="/legal/:type" element={<LegalPageWrapper />} />

        {/* PROTECTED ROUTES */}
        <Route element={session ? <MainLayout /> : <Navigate to="/" replace />}>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/saved" element={<SavedNiches niches={manualNiches} savedIds={savedNicheIds} onView={(v) => navigate(`/niche/${v.id}`)} onToggleSave={handleToggleSave} isAdmin={userProfile?.is_admin} onDelete={handleDeleteNiche} />} />
            <Route path="/niche/:id" element={<NicheDetailWrapper />} />
            <Route path="/category/:category" element={<CategoryFeedWrapper globalFilters={filters} savedIds={savedNicheIds} onToggleSave={handleToggleSave} isAdmin={userProfile?.is_admin} onDelete={handleDeleteNiche} user={userProfile} onShowUnlock={() => setIsUnlockModalOpen(true)} />} />
            <Route path="/monetization" element={<MonetizationChecker user={userProfile} onConsumeCredit={handleConsumeCredit} />} />
            <Route path="/account" element={<AccountProfile user={userProfile} onNavigate={(item) => navigate('/payment')} />} />
            <Route path="/settings" element={<Settings user={userProfile} currentLanguage={appLanguage} onLanguageChange={(l) => setAppLanguage(l)} />} />
            <Route path="/payment" element={<PaymentPage onSuccess={() => navigate('/dashboard')} user={userProfile} />} />
            
            {/* ADMIN ROUTES */}
            <Route path="/add-video" element={userProfile?.is_admin ? <AddVideoPage onAddNiche={handleAddNiche} /> : <div className="p-8">Access Denied</div>} />
            <Route path="/discovery" element={userProfile?.is_admin ? <Discovery /> : <div className="p-8">Access Denied</div>} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Wrapper for Category Feed to handle Params/Pagination via URL
const CategoryFeedWrapper: React.FC<any> = ({ globalFilters, savedIds, onToggleSave, isAdmin, onDelete, user, onShowUnlock }) => {
    const { category } = useParams();
    const navigate = useNavigate();
    return (
        <CategoryFeed 
            category={category ? decodeURIComponent(category) : 'General'} 
            onViewNiche={(v) => navigate(`/niche/${v.id}`)} 
            filters={globalFilters} 
            savedIds={savedIds} 
            onToggleSave={onToggleSave} 
            isAdmin={isAdmin} 
            onDelete={onDelete} 
            user={user} 
            onShowUnlock={onShowUnlock} 
        />
    );
};

// Wrapper for Legal Page to handle Params
const LegalPageWrapper = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    // Validate type
    if (!['privacy', 'terms', 'refund', 'affiliate'].includes(type || '')) {
        return <Navigate to="/" replace />;
    }
    return <LegalPage type={type as any} onBack={() => navigate('/')} />;
}

export default App;
