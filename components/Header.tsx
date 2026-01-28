
import React, { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, Filter, SlidersHorizontal, ChevronDown, User, LogOut, Settings, CreditCard, AlertTriangle, Menu } from 'lucide-react';
import { HeaderProps, NavItem, FilterState } from '../types';

interface ExtendedHeaderProps extends HeaderProps {
    language?: string;
    translations?: any;
}

export const Header: React.FC<ExtendedHeaderProps> = ({ 
    activeNav, 
    onNavigate, 
    filters, 
    onFilterChange, 
    onThemeToggle, 
    isDarkMode,
    user,
    onLogout,
    language = 'en-US',
    translations,
    onMobileMenuToggle
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Local state for the modal (Wait for Apply)
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Sync temp filters when modal opens or parent filters change
  useEffect(() => {
      setTempFilters(filters);
      setValidationError(null);
  }, [showFilters, filters]);

  // Click outside listeners
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          // Profile Menu
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setShowProfileMenu(false);
          }
          // Filter Modal
          if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
              setShowFilters(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Input for Local State (Modal)
  const handleLocalInputChange = (field: keyof FilterState, value: string) => {
      setTempFilters(prev => ({ ...prev, [field]: value }));
      setValidationError(null);
  };

  // Handle Input for Global State (Instant Pills)
  const handleInstantChange = (field: keyof FilterState, value: string) => {
      // Logic: If user picks specific dates, clear timeRange. If timeRange picked, clear dates.
      const changes: Partial<FilterState> = { [field]: value };
      if (field === 'timeRange' && value !== 'All') {
          changes.dateAfter = '';
          changes.dateBefore = '';
      }
      onFilterChange({ ...filters, ...changes });
  };

  const validateAndApply = () => {
      // 1. Date Validation
      if (tempFilters.dateAfter && tempFilters.dateBefore) {
          const after = new Date(tempFilters.dateAfter).getTime();
          const before = new Date(tempFilters.dateBefore).getTime();
          
          if (after > before) {
              setValidationError("Posted after date must be earlier than posted before.");
              return;
          }
      }

      // 2. Views Validation
      if (tempFilters.minViews && Number(tempFilters.minViews) < 0) {
          setValidationError("Minimum views cannot be negative.");
          return;
      }
      if (tempFilters.maxViews && Number(tempFilters.maxViews) < 0) {
          setValidationError("Maximum views cannot be negative.");
          return;
      }
      if (tempFilters.minViews && tempFilters.maxViews && Number(tempFilters.minViews) > Number(tempFilters.maxViews)) {
          setValidationError("Min views cannot be greater than Max views.");
          return;
      }

      // 3. Followers Validation
      if (tempFilters.minFollowers && Number(tempFilters.minFollowers) < 0) {
          setValidationError("Minimum followers cannot be negative.");
          return;
      }
      if (tempFilters.maxFollowers && Number(tempFilters.maxFollowers) < 0) {
          setValidationError("Maximum followers cannot be negative.");
          return;
      }
      if (tempFilters.minFollowers && tempFilters.maxFollowers && Number(tempFilters.minFollowers) > Number(tempFilters.maxFollowers)) {
          setValidationError("Min followers cannot be greater than Max followers.");
          return;
      }

      // Apply changes
      // If user selected custom dates, reset the 'timeRange' preset to 'All' so logic works
      let finalFilters = { ...tempFilters };
      if (finalFilters.dateAfter || finalFilters.dateBefore) {
          finalFilters.timeRange = 'All'; 
      }

      onFilterChange(finalFilters);
      setShowFilters(false);
  };

  const activeCount = [
      filters.minViews, filters.maxViews, filters.minFollowers, filters.maxFollowers, filters.dateAfter, filters.dateBefore
  ].filter(Boolean).length;

  // Helper to extract display name (SANITIZED: No numbers)
  const getDisplayName = () => {
      if (!user) return "Guest";
      if (user.full_name) return user.full_name;
      
      // Extract name from email, removing numbers
      const namePart = user.email.split('@')[0];
      const cleanName = namePart.replace(/[0-9]/g, '');
      
      // Capitalize first letter
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };

  // Helper for Initials
  const getInitials = () => {
      const name = getDisplayName();
      return name.charAt(0).toUpperCase();
  };

  const t = (key: string) => translations?.[key] || key;

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40 transition-colors duration-300">
      
      {/* TOP ROW: Logo Area & Navigation Tabs */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-4 md:gap-8">
              {/* Mobile Hamburger Menu */}
              <button 
                onClick={onMobileMenuToggle}
                className="md:hidden p-2 -ml-2 text-muted hover:text-foreground transition-colors"
                aria-label="Toggle Menu"
              >
                  <Menu size={24} />
              </button>

              {/* Mobile Logo Fallback */}
              <div className="md:hidden font-bold text-xl text-foreground">NicheTracker</div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-6">
                  <button 
                    onClick={() => onNavigate(NavItem.DASHBOARD)}
                    className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeNav === NavItem.DASHBOARD ? 'text-foreground border-green-500' : 'text-muted border-transparent hover:text-foreground'}`}
                  >
                      {t('Overview')}
                  </button>
                  <button 
                    onClick={() => onNavigate(NavItem.SAVED)}
                    className={`text-sm font-bold pb-1 border-b-2 transition-all ${activeNav === NavItem.SAVED ? 'text-foreground border-green-500' : 'text-muted border-transparent hover:text-foreground'}`}
                  >
                      {t('Saved')}
                  </button>
              </nav>
          </div>

          {/* Right Side Search (Visual Only for now) */}
          <div className="hidden md:flex items-center relative w-64">
             <Search className="absolute left-3 text-muted w-4 h-4" />
             <input 
               type="text" 
               placeholder={t('Search...')}
               className="w-full bg-surface border border-border rounded-full py-1.5 pl-9 pr-4 text-xs text-foreground placeholder-muted focus:outline-none focus:border-green-500 transition-all"
             />
          </div>
      </div>

      {/* BOTTOM ROW: Controls & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 pb-4 gap-4">
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
              {/* Platform Filter (Instant) */}
              <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted mr-1">Platform:</span>
                  <div className="flex bg-surface border border-border rounded-lg p-0.5">
                      {['All', 'TikTok', 'YouTube'].map((p) => (
                          <button
                            key={p}
                            onClick={() => handleInstantChange('platform', p)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                filters.platform === p 
                                ? 'bg-foreground/10 text-foreground shadow-sm font-bold' 
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                              {p}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Time Filter (Instant) */}
              <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted mr-1">Time:</span>
                  <div className="flex bg-surface border border-border rounded-lg p-0.5">
                      {['7d', '30d'].map((t) => (
                          <button
                            key={t}
                            onClick={() => handleInstantChange('timeRange', filters.timeRange === t ? 'All' : t)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                filters.timeRange === t 
                                ? 'bg-foreground/10 text-foreground shadow-sm font-bold' 
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                              {t}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Advanced Filter Modal Trigger */}
              <div className="relative ml-auto md:ml-0" ref={filterRef}>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showFilters || activeCount > 0 ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 dark:text-blue-400' : 'bg-surface border-border text-muted hover:text-foreground'}`}
                  >
                      <SlidersHorizontal size={14} />
                      Filters
                      {activeCount > 0 && (
                          <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{activeCount}</span>
                      )}
                  </button>

                  {/* FILTER MODAL POPUP */}
                  {showFilters && (
                      <div className="absolute top-full right-0 md:left-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                  <Filter size={14} className="text-blue-500 dark:text-blue-400" /> Refine Results
                              </h3>
                              <span className="text-xs text-muted">{activeCount} active</span>
                          </div>
                          
                          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                              
                              {/* Views */}
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-muted uppercase tracking-wide">Views</label>
                                  <div className="grid grid-cols-2 gap-2">
                                      <input type="number" placeholder="Min" value={tempFilters.minViews} onChange={(e) => handleLocalInputChange('minViews', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none placeholder-muted/50" />
                                      <input type="number" placeholder="Max" value={tempFilters.maxViews} onChange={(e) => handleLocalInputChange('maxViews', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none placeholder-muted/50" />
                                  </div>
                              </div>

                              {/* Followers */}
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-muted uppercase tracking-wide">Followers</label>
                                  <div className="grid grid-cols-2 gap-2">
                                      <input type="number" placeholder="Min" value={tempFilters.minFollowers} onChange={(e) => handleLocalInputChange('minFollowers', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none placeholder-muted/50" />
                                      <input type="number" placeholder="Max" value={tempFilters.maxFollowers} onChange={(e) => handleLocalInputChange('maxFollowers', e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none placeholder-muted/50" />
                                  </div>
                              </div>

                              {/* Posting Date */}
                              <div className="space-y-2">
                                  <label className="text-xs font-bold text-muted uppercase tracking-wide">Posting Window</label>
                                  <div className="space-y-2">
                                      <div>
                                          <span className="text-[10px] text-muted block mb-1">After</span>
                                          <input type="date" value={tempFilters.dateAfter} onChange={(e) => handleLocalInputChange('dateAfter', e.target.value)} className={`w-full bg-background border ${validationError?.includes('date') ? 'border-red-500' : 'border-border'} rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none`} />
                                      </div>
                                      <div>
                                          <span className="text-[10px] text-muted block mb-1">Before</span>
                                          <input type="date" value={tempFilters.dateBefore} onChange={(e) => handleLocalInputChange('dateBefore', e.target.value)} className={`w-full bg-background border ${validationError?.includes('date') ? 'border-red-500' : 'border-border'} rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500 focus:outline-none`} />
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Error Message */}
                          {validationError && (
                              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500 dark:text-red-400 flex items-start gap-1.5 leading-snug">
                                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                  {validationError}
                              </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-border flex justify-between gap-3">
                              <button onClick={() => { setTempFilters({ ...filters, minViews: '', maxViews: '', minFollowers: '', maxFollowers: '', dateAfter: '', dateBefore: '' }); setValidationError(null); }} className="text-xs text-muted hover:text-foreground font-medium px-2">Reset</button>
                              <button onClick={validateAndApply} className="text-xs bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">Apply</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          {/* Right Side Controls - Now visible on mobile */}
          <div className="flex items-center gap-4 ml-auto md:ml-0">
              <button 
                onClick={onThemeToggle}
                className="p-2 rounded-full border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
                title="Toggle Theme"
              >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {!user?.is_pro && !user?.is_admin && (
                  <button 
                    onClick={() => onNavigate(NavItem.PAYMENT)}
                    className="hidden md:block bg-green-500 hover:bg-green-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-green-900/20"
                  >
                      Upgrade to Pro
                  </button>
              )}

              {/* PROFILE DROPDOWN */}
              {user && (
                  <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 focus:outline-none"
                      >
                          {user.avatar_url ? (
                              <img src={user.avatar_url} alt="Profile" className="w-9 h-9 rounded-full border border-border object-cover" />
                          ) : (
                              // UPDATED: GREEN BACKGROUND PFP
                              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold border border-white/10 shadow-lg">
                                  {getInitials()}
                              </div>
                          )}
                          <ChevronDown size={14} className={`text-muted transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showProfileMenu && (
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#18181b] border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                              <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{getDisplayName()}</p>
                                  <p className="text-xs text-muted truncate">{user.email}</p>
                              </div>
                              
                              <div className="py-1">
                                  <button 
                                    onClick={() => { setShowProfileMenu(false); onNavigate(NavItem.ACCOUNT); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
                                  >
                                      <User size={16} /> {t('Account')}
                                  </button>
                                  <button 
                                    onClick={() => { setShowProfileMenu(false); onNavigate(NavItem.SETTINGS); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
                                  >
                                      <Settings size={16} /> {t('Settings')}
                                  </button>
                                  <button 
                                    onClick={() => { setShowProfileMenu(false); onNavigate(NavItem.PAYMENT); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors"
                                  >
                                      <CreditCard size={16} /> Subscription
                                  </button>
                              </div>

                              <div className="border-t border-gray-200 dark:border-white/5 pt-1 mt-1">
                                  <button 
                                    onClick={() => { setShowProfileMenu(false); onLogout(); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                  >
                                      <LogOut size={16} /> Sign Out
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </header>
  );
};
