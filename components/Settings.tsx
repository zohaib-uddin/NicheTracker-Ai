
import React, { useState, useEffect } from 'react';
import { Bell, Lock, Globe, Save, Smartphone, Mail, Trash2, AlertTriangle, Check, X, Zap } from 'lucide-react';
import { sendGoogleScriptNotification } from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface SettingsProps {
    onLanguageChange: (lang: string) => void;
    currentLanguage: string;
    user: UserProfile | null;
}

export const Settings: React.FC<SettingsProps> = ({ onLanguageChange, currentLanguage, user }) => {
  // Default values
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [newVideoAlerts, setNewVideoAlerts] = useState(false);
  const [language, setLanguage] = useState(currentLanguage);
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize state from User Profile (DB Source of Truth)
  useEffect(() => {
      if (user?.settings) {
          // Load specific preferences from DB
          setEmailNotifs(user.settings.email_notifications ?? true);
          setNewVideoAlerts(user.settings.new_video_alerts ?? false);
          
          if (user.settings.language) {
              setLanguage(user.settings.language);
              onLanguageChange(user.settings.language); // Sync app state
          }
      } else {
          // Legacy Fallback (Local Storage)
          const storedAlerts = localStorage.getItem('sub_new_video');
          if(storedAlerts) setNewVideoAlerts(storedAlerts === 'true');
      }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    onLanguageChange(language);
    
    // 1. Local Storage Backup
    localStorage.setItem('sub_new_video', newVideoAlerts.toString());

    // 2. Prepare Settings Object
    const newSettings = {
        email_notifications: emailNotifs,
        new_video_alerts: user?.is_pro ? newVideoAlerts : false, // Force false if not Pro
        language: language
    };

    if (user && supabase) {
        try {
            // 3. PRIORITY: Update Auth Metadata (Robust persistence even without DB table)
            // This ensures settings persist across logins immediately
            const { error: metaError } = await supabase.auth.updateUser({ 
                data: { settings: newSettings } 
            });
            
            if (metaError) throw metaError;

            // 4. SECONDARY: Try to update 'public.users' table
            // We catch and ignore errors here if the table is missing (PGRST205)
            try {
                await supabase.from('users').update({
                    settings: newSettings,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);
            } catch (dbErr: any) {
                // If table is missing, just ignore it. Metadata saved successfully.
                if (dbErr.code !== 'PGRST205' && !dbErr.message?.includes('schema cache')) {
                    console.warn("DB Sync skipped:", dbErr.message);
                }
            }
            
        } catch (e) {
            console.error("Failed to save settings", e);
            alert("Failed to save settings. Please try again.");
        }
    }

    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleTestNotification = async () => {
      if (!user || !user.is_pro) return;
      setIsTesting(true);
      try {
          await sendGoogleScriptNotification('test', user.email, { 
              video_title: "Test Alert", 
              category: "System",
              is_pro: true 
          });
          alert("Test alert request sent. If URL is configured correctly, check your email.");
      } catch (e) {
          alert("Failed to send test alert.");
      } finally {
          setIsTesting(false);
      }
  };

  const executeDeleteAccount = async () => {
      if (deleteConfirmation !== 'DELETE') return;
      
      setIsDeleting(true);
      
      try {
          if (supabase && user) {
              const { error } = await supabase.rpc('delete_own_account');

              if (error) {
                  // Fallback delete
                  await supabase.from('users').delete().eq('id', user.id);
                  await supabase.auth.signOut();
              }
          }
          localStorage.clear();
          window.location.href = "/"; 

      } catch (e: any) {
          console.error("Delete error:", e);
          localStorage.clear();
          window.location.href = "/"; 
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 relative">
        
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-muted">Configure your workspace and preferences.</p>
            </div>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 py-2.5 rounded-lg font-bold text-white flex items-center gap-2 shadow-lg transition-all ${
                    isSaving 
                    ? 'bg-green-600 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                }`}
            >
                {isSaving ? 'Saving...' : 'Save Changes'}
                {isSaving ? <Check size={18} className="animate-pulse" /> : <Save size={18} />}
            </button>
        </div>

        <div className="space-y-6">
            
            {/* LANGUAGE SETTINGS */}
            <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-blue-500 dark:text-blue-400" />
                    General Preferences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-muted mb-2">Language</label>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-black/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="en-US">English (US)</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* NOTIFICATION SETTINGS */}
            <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <Bell size={20} className="text-yellow-500 dark:text-yellow-400" />
                    Notification Preferences
                </h2>
                
                <div className="space-y-6">
                    
                    {/* Weekly Digest */}
                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-white/5 rounded-full shadow-sm"><Mail size={20} className="text-gray-500 dark:text-gray-300"/></div>
                            <div>
                                <div className="text-sm font-bold text-foreground">Weekly Digest</div>
                                <div className="text-xs text-muted mt-0.5">Receive a summary of top performing niches every Monday.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={emailNotifs} 
                                onChange={() => setEmailNotifs(!emailNotifs)} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* New Video Alerts (PRO ONLY) */}
                    <div className={`flex items-center justify-between p-4 bg-gray-100 dark:bg-black/20 rounded-xl border transition-colors ${user?.is_pro ? 'border-primary/20 bg-primary/5' : 'border-gray-200 dark:border-white/5 opacity-80'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full shadow-sm ${user?.is_pro ? 'bg-primary/20 text-primary' : 'bg-white dark:bg-white/5 text-gray-400'}`}>
                                <Zap size={20} fill={user?.is_pro ? "currentColor" : "none"} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                    Instant Video Alerts
                                    {user?.is_pro ? (
                                        <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded font-bold border border-green-500/30">PRO ACTIVE</span>
                                    ) : (
                                        <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-bold border border-gray-300 dark:border-gray-600 flex items-center gap-1">
                                            <Lock size={8} /> PRO ONLY
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted mt-0.5 max-w-md">
                                    Get an immediate email whenever a new viral video is added to <strong>any category</strong>. Never miss a trend.
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {user?.is_pro && newVideoAlerts && (
                                <button 
                                    onClick={handleTestNotification}
                                    disabled={isTesting}
                                    className="text-xs text-primary font-bold hover:underline disabled:opacity-50"
                                >
                                    {isTesting ? 'Sending...' : 'Test Alert'}
                                </button>
                            )}
                            
                            <label className={`relative inline-flex items-center ${!user?.is_pro ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={newVideoAlerts && !!user?.is_pro} 
                                    onChange={() => user?.is_pro && setNewVideoAlerts(!newVideoAlerts)} 
                                    disabled={!user?.is_pro}
                                    className="sr-only peer" 
                                />
                                <div className={`w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${user?.is_pro ? 'peer-checked:bg-primary' : ''}`}></div>
                            </label>
                        </div>
                    </div>

                </div>
            </div>

            {/* DANGER ZONE */}
             <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-red-500 dark:text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    Danger Zone
                </h2>
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm font-bold text-foreground">Delete Account</div>
                        <div className="text-xs text-muted">Permanently remove your account and data from Supabase.</div>
                    </div>
                    <button 
                        onClick={() => {
                            setShowDeleteModal(true);
                            setDeleteConfirmation('');
                        }}
                        className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete Account
                    </button>
                </div>
            </div>

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#27272a] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-foreground"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This will permanently delete your authentication record and all associated data.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                    Type <span className="text-gray-900 dark:text-white">DELETE</span> to confirm
                                </label>
                                <input 
                                    type="text" 
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-gray-100 dark:bg-black/50 border border-red-500/30 rounded-lg p-3 text-foreground focus:outline-none focus:border-red-500 text-center font-mono tracking-wider"
                                />
                            </div>

                            <button 
                                onClick={executeDeleteAccount}
                                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                                className={`w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                                    deleteConfirmation === 'DELETE' 
                                    ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20' 
                                    : 'bg-gray-400 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                            </button>

                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};
