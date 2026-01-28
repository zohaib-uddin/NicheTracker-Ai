
import React, { useState } from 'react';
import { Check, ShieldCheck, CreditCard, Lock, ExternalLink, Zap, Loader2, ArrowLeft, Crown, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types';

// 🔴 TODO: PASTE YOUR REAL STRIPE PAYMENT LINKS HERE
// Go to Stripe Dashboard -> Product Catalog -> Create Payment Link
const STRIPE_MONTHLY_URL = "https://buy.stripe.com/test_monthly_placeholder"; 
const STRIPE_YEARLY_URL = "https://buy.stripe.com/test_yearly_placeholder";

interface PaymentPageProps {
    onSuccess: () => void;
    user?: UserProfile | null;
    onBack?: () => void; // Added onBack support
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ onSuccess, user, onBack }) => {
    const [processing, setProcessing] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly' | null>(null);

    // RENEWAL DATE CALCULATION
    const getRenewalDate = () => {
      const baseDateStr = user?.subscription_start_date || user?.joined_at;
      const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
      const now = new Date();
      const interval = user?.plan_interval || 'monthly';
      
      let nextDate = new Date(baseDate);
      while (nextDate <= now) {
          if (interval === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
    };

    const handleStripeCheckout = async (cycle: 'monthly' | 'yearly') => {
        setProcessing(true);
        setSelectedCycle(cycle);

        // 1. Determine the correct Stripe Link based on selection
        const baseUrl = cycle === 'monthly' ? STRIPE_MONTHLY_URL : STRIPE_YEARLY_URL;

        // 2. Append User Email for Auto-Fill
        // Stripe automatically handles Country/Region detection via IP on their hosted page.
        const userEmail = user?.email || '';
        
        // 3. Construct Final URL
        // We use 'prefilled_email' to auto-populate the Stripe form
        const separator = baseUrl.includes('?') ? '&' : '?';
        const finalUrl = `${baseUrl}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;

        // 4. Redirect
        // Adding a small delay for UX feedback (button state change)
        setTimeout(() => {
            window.location.href = finalUrl;
        }, 800);
    };

    // --- ADMIN VIEW ---
    if (user?.is_admin) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center animate-in fade-in slide-in-from-bottom-8">
                <div className="inline-flex p-6 bg-purple-500/10 rounded-full mb-6 border border-purple-500/20 shadow-lg shadow-purple-500/20">
                    <Crown size={48} className="text-purple-500" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-4">Super Admin Access</h1>
                <p className="text-muted text-lg max-w-md mx-auto mb-8 leading-relaxed">
                    You have unlimited, lifetime access to all features. No subscription is required for your account.
                </p>
                <div className="bg-surface border border-border rounded-xl p-6 max-w-sm mx-auto shadow-2xl">
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted font-medium">Status</span>
                        <span className="text-green-500 font-bold flex items-center gap-1.5"><CheckCircle size={14} /> Active Forever</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                        <span className="text-muted font-medium">Plan</span>
                        <span className="text-foreground font-bold">System Administrator</span>
                    </div>
                </div>
                {onBack && (
                    <button 
                        onClick={onBack}
                        className="mt-8 text-sm font-bold text-muted hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                )}
            </div>
        );
    }

    // --- MANAGE SUBSCRIPTION VIEW (IF ALREADY PRO) ---
    if (user?.is_pro) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
                {onBack && (
                    <button onClick={onBack} className="flex items-center gap-2 text-muted hover:text-foreground font-bold text-sm mb-6 transition-colors">
                        <ArrowLeft size={16} /> Back
                    </button>
                )}
                
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Manage Subscription</h1>
                    <p className="text-muted">Your plan details and payment method.</p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-24 bg-green-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <div className="text-xs text-green-500 dark:text-green-400 font-bold uppercase tracking-wider mb-1">Current Plan</div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Pro {user.plan_interval === 'yearly' ? 'Yearly' : 'Monthly'}
                            </h2>
                        </div>
                        <div className="bg-green-500/10 text-green-500 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                            Active
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="bg-gray-100 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-white/5 flex items-center gap-4">
                            <div className="bg-white dark:bg-white/10 p-2 rounded-lg">
                                <CreditCard size={24} className="text-gray-900 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-foreground">Stripe Secure Payment</div>
                                <div className="text-xs text-muted">Managed via Stripe Customer Portal</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm py-2 border-t border-gray-200 dark:border-white/5">
                            <span className="text-muted">Next billing date</span>
                            <span className="text-foreground font-mono">{getRenewalDate()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm py-2 border-t border-gray-200 dark:border-white/5">
                            <span className="text-muted">Total amount</span>
                            <span className="text-foreground font-bold">
                                {user.plan_interval === 'yearly' ? '$50.00 / year' : '$10.00 / month'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 flex gap-4 relative z-10">
                        <button className="flex-1 py-3 bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 font-bold rounded-xl hover:bg-red-500/20 transition-colors text-sm">
                            Cancel Subscription
                        </button>
                        <button className="flex-1 py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors text-sm">
                            Billing Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- UPGRADE VIEW (NEW DESIGN) ---
    return (
        <div className="min-h-screen bg-background text-foreground py-12 px-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 relative">
            
            {/* Back Button (Only if prop provided) */}
            {onBack && (
                <button 
                    onClick={onBack} 
                    className="absolute top-8 left-8 flex items-center gap-2 text-green-500 hover:text-green-400 font-bold text-sm transition-colors group z-20"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                    Back to home
                </button>
            )}

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-12 mt-8">
                <span className="inline-block py-1.5 px-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider mb-6">
                    Upgrade in seconds
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                    Select a plan to discover your next viral-winning niche
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Seamless Stripe checkout, instant access, no contracts. Cancel anytime from the customer portal.
                </p>
            </div>

            {/* Pricing Card */}
            <div className="w-full max-w-[420px] bg-[#121214] border border-[#27272a] rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.01]">
                
                {/* Card Content */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-3">Pro</h2>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                        All of NicheTracker AI's growth tools in one plan—perfect for creators and teams shipping consistently each week.
                    </p>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-6xl font-black text-white tracking-tighter">$10</span>
                        <span className="text-gray-400 font-medium text-lg">per month</span>
                    </div>
                    <p className="text-green-500 text-sm font-bold mt-2 flex items-center gap-1.5">
                        <Zap size={14} fill="currentColor" />
                        Or $50 billed yearly — save 30%
                    </p>
                </div>

                <ul className="space-y-4 mb-10">
                    {[
                        'Unlimited dashboard and discovery access',
                        'Saved video library with smart filters',
                        'AI idea generation and creative prompts',
                        'Export-ready performance reports',
                        'Priority email support'
                    ].map((feat, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 bg-green-500/20 p-1 rounded-full shrink-0">
                                <Check size={12} className="text-green-500 stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-300 font-medium">{feat}</span>
                        </li>
                    ))}
                </ul>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleStripeCheckout('monthly')}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl transition-all font-bold flex flex-col items-center justify-center leading-tight group shadow-lg shadow-green-900/20 hover:shadow-green-500/20"
                    >
                        {processing && selectedCycle === 'monthly' ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <span className="text-sm font-extrabold">Subscribe Monthly — $10/mo</span>
                                <span className="text-[10px] font-medium opacity-80 group-hover:opacity-100">Flexible billing, cancel anytime</span>
                            </>
                        )}
                    </button>

                    <button 
                        onClick={() => handleStripeCheckout('yearly')}
                        disabled={processing}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl transition-all font-bold flex flex-col items-center justify-center leading-tight group shadow-lg shadow-green-900/20 hover:shadow-green-500/20"
                    >
                         {processing && selectedCycle === 'yearly' ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <span className="text-sm font-extrabold">Subscribe Yearly — $50/yr</span>
                                <span className="text-[10px] font-medium opacity-80 group-hover:opacity-100">Save 30% with yearly billing</span>
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* Footer */}
            <div className="mt-12 text-center space-y-4 pb-12">
                <p className="text-sm text-gray-400 font-medium">
                    Need a custom plan?  <a 
  href="mailto:contact@nichetracker.ai" 
    className="text-green-500 font-bold"
>
  Talk with us
</a>
                </p>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    All subscriptions are backed by Stripe and can be managed through the customer portal.
                </p>
            </div>

        </div>
    );
};
