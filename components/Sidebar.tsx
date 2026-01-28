
import React from 'react';
import { NavItem, SidebarProps } from '../types';
import { 
  LayoutDashboard, 
  Compass, 
  Bookmark, 
  User, 
  Settings, 
  Zap,
  Gamepad2,
  BrainCircuit,
  Ghost,
  BookOpen,
  Dumbbell,
  ShieldAlert,
  Car,
  Map,
  PlusCircle,
  DollarSign,
  Video,
  Lock,
  X
} from 'lucide-react';

export const Sidebar: React.FC<SidebarProps> = ({ 
    activeNav, 
    onNavigate, 
    onSelectCategory, 
    activeCategory, 
    isPro, 
    isAdmin, 
    onShowUnlock,
    mobileOpen,
    onMobileClose
}) => {
  
  const mainNavItems = [
    { id: NavItem.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    // Show 'Add Video' ONLY if Admin
    ...(isAdmin ? [{ id: NavItem.ADD_VIDEO, icon: Video, label: 'Add Video', highlight: true }] : []),
    { id: NavItem.MONETIZATION, icon: DollarSign, label: 'Monetization Checker' },
    // Show 'Discovery' ONLY if Admin
    ...(isAdmin ? [{ id: NavItem.DISCOVERY, icon: Compass, label: 'Discovery' }] : []),
    { id: NavItem.SAVED, icon: Bookmark, label: 'Saved Niches' },
  ];

  const categoryItems = [
    { id: 'cat-ai', icon: BrainCircuit, label: 'AI Automation', filter: 'AI Automation' },
    { id: 'cat-gaming', icon: Gamepad2, label: 'Gaming', filter: 'Gaming' },
    { id: 'cat-horror', icon: Ghost, label: 'Horror / Crime', filter: 'Horror' },
    { id: 'cat-stories', icon: BookOpen, label: 'Stories & Trivia', filter: 'Stories' },
    { id: 'cat-motivation', icon: Dumbbell, label: 'Motivation', filter: 'Motivation' },
    { id: 'cat-cars', icon: Car, label: 'Cars', filter: 'Cars' },
    { id: 'cat-geo', icon: Map, label: 'Geography', filter: 'Geography' },
  ];

  const systemItems = [
    // Removed ADMIN PANEL entirely
    { id: NavItem.ACCOUNT, icon: User, label: 'Account' },
    { id: NavItem.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  const handleCategoryClick = (catFilter: string) => {
      // LOCK LOGIC (Admin bypasses)
      if (!isPro && !isAdmin) {
          onShowUnlock();
          return;
      }

      if (onSelectCategory) {
          onSelectCategory(catFilter);
          // Removed onNavigate(NavItem.CATEGORY) to prevent double navigation/conflict
          // The onSelectCategory call handles the routing via App.tsx
      }
      
      // Close sidebar on mobile when clicked
      if (mobileOpen && onMobileClose) onMobileClose();
  };

  const handleNavClick = (id: NavItem) => {
      onNavigate(id);
      if (mobileOpen && onMobileClose) onMobileClose();
  }

  return (
    <>
        {/* Mobile Overlay */}
        {mobileOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
                onClick={onMobileClose}
            ></div>
        )}

        <aside 
            className={`
                fixed top-0 bottom-0 left-0 z-50 w-64 flex-col bg-surface border-r border-border h-screen overflow-y-auto custom-scrollbar transition-transform duration-300 ease-in-out
                md:sticky md:translate-x-0
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="p-6 flex items-center justify-between gap-2 sticky top-0 bg-surface z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Zap className="text-white w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">NicheTracker</span>
                </div>
                {/* Close Button on Mobile */}
                <button 
                    onClick={onMobileClose} 
                    className="md:hidden p-1 text-muted hover:text-foreground rounded-lg"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="px-4 py-2">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-3">Menu</div>
                <nav className="space-y-1">
                {mainNavItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeNav === item.id && activeNav !== NavItem.CATEGORY
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : (item as any).highlight 
                            ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 border border-blue-400/20'
                            : 'text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                    >
                    <item.icon size={18} />
                    {item.label}
                    </button>
                ))}
                </nav>
            </div>

            <div className="px-4 py-2 mt-2">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-3">Categories</div>
                <nav className="space-y-1">
                {categoryItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => handleCategoryClick(item.filter)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeNav === NavItem.CATEGORY && activeCategory === item.filter
                            ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20'
                            : 'text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5 group'
                    }`}
                    >
                    <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        {item.label}
                    </div>
                    {!isPro && !isAdmin && <Lock size={12} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />}
                    </button>
                ))}
                </nav>
            </div>

            <div className="px-4 py-2 mt-2 mb-20">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-3">System</div>
                <nav className="space-y-1">
                {systemItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeNav === item.id 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                    >
                    <item.icon size={18} />
                    {item.label}
                    </button>
                ))}
                </nav>
            </div>

            {/* Hide Upgrade Box for Admin */}
            {!isPro && !isAdmin && (
                <div className="p-4 border-t border-border bg-surface sticky bottom-0">
                    <div className="bg-gradient-to-br from-gray-100 to-white dark:from-black dark:to-gray-900 p-4 rounded-xl border border-border relative overflow-hidden group cursor-pointer shadow-lg" onClick={onShowUnlock}>
                    <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h4 className="text-sm font-semibold text-foreground mb-1 relative z-10">Pro Plan</h4>
                    <p className="text-xs text-muted mb-3 relative z-10">Unlock every niche board.</p>
                    <button className="w-full bg-green-500 text-black text-xs font-bold py-2 rounded-lg hover:bg-green-400 transition-colors relative z-10 shadow-lg shadow-green-900/50">
                        Upgrade to Pro
                    </button>
                    </div>
                </div>
            )}
        </aside>
    </>
  );
};
