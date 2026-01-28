
import React, { useState } from 'react';
import { Search, Filter, TrendingUp, Zap, Globe, Lock, Play, Layers } from 'lucide-react';
import { NicheData } from '../types';

export const Discovery: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  // Mock Discovery Data (Simulating a global database of trends)
  const discoveryItems = [
    {
        title: "Hydro-Dipping Phone Cases",
        category: "DIY & Crafts",
        views: "12.5M",
        growth: "+450%",
        difficulty: "Low",
        platform: "TikTok",
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80",
        premium: false
    },
    {
        title: "AI Voiceover History Facts",
        category: "Education",
        views: "8.2M",
        growth: "+120%",
        difficulty: "Medium",
        platform: "YouTube",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        premium: false
    },
    {
        title: "ASMR Kinetic Sand Cutting",
        category: "Oddly Satisfying",
        views: "45M",
        growth: "+85%",
        difficulty: "Low",
        platform: "TikTok",
        image: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae91?w=800&q=80",
        premium: true
    },
    {
        title: "Faceless Finance Tips",
        category: "Business",
        views: "5.1M",
        growth: "+300%",
        difficulty: "High",
        platform: "YouTube",
        image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
        premium: true
    },
    {
        title: "Minecraft Parkour Stories",
        category: "Gaming",
        views: "22M",
        growth: "+65%",
        difficulty: "Medium",
        platform: "TikTok",
        image: "https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=800&q=80",
        premium: false
    },
    {
        title: "Gym Failure Reactions",
        category: "Fitness",
        views: "9.8M",
        growth: "+150%",
        difficulty: "Low",
        platform: "YouTube",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
        premium: false
    }
  ];

  const categories = ['All', 'Gaming', 'DIY', 'Business', 'Education', 'Fitness'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Trend Discovery</h1>
            <p className="text-muted text-sm md:text-base">Explore the global database of rising niches before they go mainstream.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors">
                <Filter size={16} /> Filters
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
                <Globe size={16} /> Global Feed
            </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="relative">
            <Search className="absolute left-4 top-3.5 text-muted w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search keywords like 'ASMR', 'Crypto', 'Minecraft'..." 
                className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
        </div>
        
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === cat 
                        ? 'bg-foreground text-background font-bold' 
                        : 'bg-surface border border-border text-muted hover:text-foreground'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discoveryItems.map((item, idx) => (
            <div key={idx} className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer relative shadow-sm hover:shadow-lg">
                {/* Image */}
                <div className="h-40 w-full bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {item.premium && (
                        <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Lock size={10} /> PRO
                        </div>
                    )}
                    
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-xs text-white flex items-center gap-1 shadow-lg">
                         {item.platform === 'TikTok' ? (
                             <span className="flex items-center gap-1"><span className="text-pink-500 font-bold">TikTok</span></span>
                         ) : (
                            <span className="flex items-center gap-1"><span className="text-red-500 font-bold">YouTube</span></span>
                         )}
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-blue-500 dark:text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded">{item.category}</span>
                        <span className="text-xs text-green-500 dark:text-green-400 font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> {item.growth}
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                            <span className="text-muted text-xs block">Monthly Views</span>
                            <span className="text-foreground font-bold">{item.views}</span>
                        </div>
                        <div>
                            <span className="text-muted text-xs block">Competition</span>
                            <span className={`font-bold ${
                                item.difficulty === 'Low' ? 'text-green-500' : 
                                item.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                            }`}>{item.difficulty}</span>
                        </div>
                    </div>

                    <button className="w-full py-2 bg-gray-100 dark:bg-white/5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                        <Layers size={16} />
                        Analyze this Niche
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Pro Upsell */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/30 rounded-2xl p-8 text-center relative overflow-hidden text-white shadow-2xl">
        <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Unlock 10,000+ Viral Niches</h2>
            <p className="text-indigo-200 mb-6 max-w-lg mx-auto">Stop guessing. Get access to our full database of high-CPM, low-competition niches updated hourly.</p>
            <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-xl shadow-white/10">
                Upgrade to Pro Plan
            </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>
    </div>
  );
};
