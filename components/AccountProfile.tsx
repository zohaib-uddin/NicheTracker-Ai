
import React, { useState, useEffect } from 'react';
import { User, Shield, Zap, CheckCircle, TrendingUp, Clock, Download, PenLine, Save, Loader2, Calendar, CreditCard, Crown } from 'lucide-react';
import { UserProfile, NavItem } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateInvoice } from '../services/pdfService';

interface AccountProfileProps {
    user?: UserProfile | null;
    onNavigate?: (nav: NavItem) => void;
}

export const AccountProfile: React.FC<AccountProfileProps> = ({ user, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  // Logic to get name from email if name is missing (Sanitized: No Numbers)
  const getCleanName = () => {
      if (user?.full_name && user.full_name.trim() !== '') return user.full_name;
      if (user?.email) {
          const namePart = user.email.split('@')[0];
          const clean = namePart.replace(/[0-9]/g, ''); // Remove numbers
          return clean.charAt(0).toUpperCase() + clean.slice(1);
      }
      return "User";
  };

  useEffect(() => {
      if (user) {
          setDisplayName(getCleanName());
      }
  }, [user]);

  const handleUpdateProfile = async () => {
      if (!user || !displayName.trim()) return;
      
      setIsSaving(true);
      
      try {
          if (supabase) {
              const { error: authError } = await supabase.auth.updateUser({
                  data: { full_name: displayName }
              });

              if (authError) throw authError;

              try {
                  const { error: dbError } = await supabase
                      .from('users')
                      .upsert({
                          id: user.id,
                          email: user.email,
                          full_name: displayName,
                          is_pro: user.is_pro || false,
                          joined_at: user.joined_at, 
                          subscription_start_date: user.subscription_start_date,
                          usage: user.usage,
                          saved_ids: user.saved_ids,
                          settings: user.settings
                      }, { onConflict: 'id' });
                  
                  if (dbError && dbError.code !== 'PGRST205' && dbError.code !== '42P01') {
                      console.error("Database update warning:", dbError.message);
                  }
              } catch (dbErr) {
                  console.warn("DB Update skipped:", dbErr);
              }
          }
          setIsEditing(false);
      } catch (err: any) {
          console.error("Profile update error:", err);
          alert(`Failed to update name: ${err.message || "Unknown error"}`);
      } finally {
          setIsSaving(false);
      }
  };

  const handleDownloadInvoice = () => {
      if (user) {
          generateInvoice(
              { ...user, full_name: displayName }, 
              new Date(), 
              planPrice
          );
      }
  };

  // --- DATE LOGIC ---
  const formatExactDate = (dateStr?: string) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      // Format: "18 January 2025"
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getRenewalDate = () => {
      // Use subscription start date if Pro, otherwise joined date
      const baseDateStr = user?.is_pro ? (user.subscription_start_date || user.joined_at) : user?.joined_at;
      const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
      
      const now = new Date();
      const interval = user?.plan_interval || 'monthly';
      
      let nextDate = new Date(baseDate);
      
      // Calculate next renewal
      while (nextDate <= now) {
          if (interval === 'yearly') {
              nextDate.setFullYear(nextDate.getFullYear() + 1);
          } else {
              nextDate.setMonth(nextDate.getMonth() + 1);
          }
      }
      
      return nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Plan Details
  const isPro = user?.is_pro;
  const isAdmin = user?.is_admin;
  
  const planName = isAdmin ? 'Super Admin' : (isPro ? (user.plan_interval === 'yearly' ? 'Pro Yearly' : 'Pro Monthly') : 'Free Starter');
  const planPrice = isPro ? (user.plan_interval === 'yearly' ? '$50.00' : '$10.00') : '$0.00';
  const renewalDate = getRenewalDate();
  
  // Use specific subscription date if available, else join date
  const purchasedDate = isPro ? formatExactDate(user?.subscription_start_date || user?.joined_at) : "N/A";

  // Usage Limits Logic
  const usage = user?.usage || { ai_analysis_used: 0, monetization_checks_used: 0, tracked_niches: 0 };
  
  // --- LIMITS CONFIGURATION ---
  const aiLimit = 20; 
  const monLimit = isPro ? 20 : 3; // 3 Free, 20 Pro (Daily)
  
  // Percentage Calcs
  const aiPercent = isPro ? (usage.ai_analysis_used / aiLimit) * 100 : 0;
  const monPercent = (usage.monetization_checks_used / monLimit) * 100;
  
  const trackedCount = usage.tracked_niches || 0;
  const trackedVisualPercent = Math.min((trackedCount / 100) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">My Account</h1>
            <p className="text-sm md:text-base text-muted">Manage your subscription, usage limits, and billing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Profile & Usage */}
            <div className="space-y-6 lg:col-span-2">
                
                {/* Profile Card */}
                <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-primary object-cover" alt="Profile" />
                        ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 md:w-5 md:h-5 rounded-full border-4 border-surface"></div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                            <div className="w-full mr-4">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="bg-gray-100 dark:bg-black/30 border border-primary rounded px-2 py-1 text-lg md:text-xl font-bold text-foreground focus:outline-none mb-1 w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className="text-lg md:text-xl font-bold text-foreground">{displayName}</h2>
                                )}
                                <p className="text-muted text-xs md:text-sm mb-3 break-all">{user?.email}</p>
                            </div>
                            <button 
                                onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                                disabled={isSaving}
                                className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-foreground transition-colors shrink-0"
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin text-green-500 dark:text-green-400" />
                                ) : isEditing ? (
                                    <Save size={18} className="text-green-500 dark:text-green-400" />
                                ) : (
                                    <PenLine size={18} />
                                )}
                            </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <span className={`px-3 py-1 border text-xs font-bold rounded-full uppercase ${isAdmin ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400' : isPro ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                {planName}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">
                                Joined {formatExactDate(user?.joined_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Usage Stats */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Zap className="text-yellow-500 dark:text-yellow-400" size={20} /> Daily Usage
                        </h3>
                        <span className="text-[10px] md:text-xs text-muted flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                            <Clock size={12} /> Resets 00:00
                        </span>
                    </div>

                    <div className="space-y-8">
                        {/* AI Deep Analysis */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    AI Analysis
                                    {!isPro && !isAdmin && <span className="text-[10px] bg-red-500/10 text-red-500 dark:text-red-400 px-1.5 rounded border border-red-500/20 font-bold">LOCKED</span>}
                                </span>
                                <span className={!isPro && !isAdmin ? "text-red-500 dark:text-red-400 font-bold" : "text-gray-900 dark:text-white font-bold"}>
                                    {isAdmin ? "UNLIMITED" : (!isPro ? "0 / 0" : `${usage.ai_analysis_used} / ${aiLimit}`)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${!isPro && !isAdmin ? 'bg-red-900/50 w-full' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} 
                                    style={{ width: isAdmin ? '100%' : (!isPro ? '100%' : `${aiPercent}%`) }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                {!isPro && !isAdmin ? "Upgrade to Pro to get 20 AI credits daily." : "Generates hooks, scripts & viral concepts. Daily quota resets at midnight."}
                            </p>
                        </div>

                        {/* Monetization Checker */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-300">Monetization Checker</span>
                                <span className="text-gray-900 dark:text-white font-bold">
                                    {isAdmin ? "UNLIMITED" : `${usage.monetization_checks_used} / ${monLimit}`}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`bg-gradient-to-r from-green-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500`} 
                                    style={{ width: isAdmin ? '100%' : `${Math.min(monPercent, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                Checks eligibility & estimated RPM. {isAdmin ? "Unlimited usage." : (isPro ? "20 checks per day." : "3 free checks per day.")} Resets automatically daily.
                            </p>
                        </div>

                        {/* Tracked Niches */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-300">Tracked Niches</span>
                                <span className="text-gray-900 dark:text-white font-bold flex items-center gap-1">
                                    {trackedCount} / 
                                    <span className="text-[10px] text-green-500 dark:text-green-400 font-normal border border-green-500/30 px-1.5 rounded-md bg-green-500/10">UNLIMITED</span>
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-400 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.max(5, trackedVisualPercent)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5">
                                Total videos analyzed in detail. Never capped.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Billing History (Hidden for Admin) */}
                {!isAdmin && (
                    <div className="bg-surface border border-border rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <CreditCard className="text-gray-400" size={20} /> Billing History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="text-xs text-muted uppercase border-b border-gray-200 dark:border-white/10">
                                    <tr>
                                        <th className="pb-3 pr-4">Date</th>
                                        <th className="pb-3 pr-4">Description</th>
                                        <th className="pb-3 pr-4">Amount</th>
                                        <th className="pb-3 pr-4">Status</th>
                                        <th className="pb-3 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                    {isPro ? (
                                        [1].map((i) => (
                                            <tr key={i} className="group">
                                                <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                                                    {purchasedDate}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-900 dark:text-white">{planName} Subscription</td>
                                                <td className="py-3 pr-4 text-gray-900 dark:text-white font-mono">{planPrice}</td>
                                                <td className="py-3 pr-4"><span className="text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-xs font-bold">Paid</span></td>
                                                <td className="py-3 text-right">
                                                    <button 
                                                        onClick={handleDownloadInvoice}
                                                        className="text-gray-500 dark:text-gray-400 hover:text-foreground flex items-center gap-1 ml-auto text-xs"
                                                    >
                                                        <Download size={14} /> Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-muted text-xs italic">
                                                No billing history available for free plan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

            {/* Right Col: Manage Subscription (Hidden for Admin) */}
            {!isAdmin && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-white to-gray-100 dark:from-[#18181b] dark:to-black border border-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-24 bg-green-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-3 bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-300 dark:border-white/10">
                                <Shield className="text-green-500 dark:text-green-400" size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Current Plan</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{planName}</div>
                            </div>
                        </div>

                        <div className="mb-6 relative z-10">
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{planPrice}</span>
                                <span className="text-sm text-gray-500 mb-1.5 font-medium">/{user?.plan_interval === 'yearly' ? 'year' : 'mo'}</span>
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5 bg-green-500/10 w-fit px-2 py-1 rounded">
                                <CheckCircle size={12} /> Active Subscription
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 relative z-10">
                            <div className="h-px bg-gray-200 dark:bg-white/10 mb-4"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Status</span>
                                <span className="text-gray-900 dark:text-white font-bold">Active</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Purchased On</span>
                                <span className="text-gray-900 dark:text-white">
                                    {purchasedDate}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Next Renewal</span>
                                <span className="text-green-600 dark:text-green-400 font-mono font-bold">{isPro ? renewalDate : 'N/A'}</span>
                            </div>
                        </div>

                        {!isPro ? (
                            <button className="w-full py-3.5 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all shadow-lg shadow-green-900/20 relative z-10">
                                Upgrade to Pro
                            </button>
                        ) : (
                            <div className="space-y-3 relative z-10">
                                <button 
                                    onClick={() => onNavigate && onNavigate(NavItem.PAYMENT)}
                                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                                >
                                    Manage Payment Method
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Referral Card */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                        <h4 className="font-bold text-blue-600 dark:text-blue-200 flex items-center gap-2 mb-2 relative z-10">
                            <TrendingUp size={18} />
                            Affiliate Program
                        </h4>
                        <p className="text-sm text-blue-600/70 dark:text-blue-200/70 mb-4 relative z-10">
                            Earn <strong className="text-blue-800 dark:text-white">20% commission</strong> for every creator you refer to Nych.ai.
                        </p>
                        <div className="flex gap-2 relative z-10">
                            <input 
                                type="text" 
                                value={`nych.ai/ref/${getCleanName().toLowerCase()}`} 
                                readOnly 
                                className="bg-white/50 dark:bg-black/30 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-white flex-1 font-mono w-full min-w-0" 
                            />
                            <button className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/20 shrink-0">
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Badge */}
            {isAdmin && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 text-center">
                    <div className="inline-flex p-3 bg-purple-500/20 rounded-full mb-4">
                        <Crown size={32} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Super Admin Access</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        You have unlimited access to all features, AI credits, and database controls.
                    </p>
                </div>
            )}

        </div>
    </div>
  );
};
