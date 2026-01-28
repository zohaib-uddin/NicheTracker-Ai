import React from 'react';
import { NicheData } from '../types';
import { X, Check, Copy, TrendingUp, BarChart, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface NicheDetailModalProps {
  niche: NicheData;
  onClose: () => void;
}

export const NicheDetailModal: React.FC<NicheDetailModalProps> = ({ niche, onClose }) => {
  
  // Mock data for the chart
  const chartData = [
    { day: 'Mon', value: 4000 },
    { day: 'Tue', value: 3000 },
    { day: 'Wed', value: 5000 },
    { day: 'Thu', value: 4500 },
    { day: 'Fri', value: 6000 },
    { day: 'Sat', value: 7500 },
    { day: 'Sun', value: 8000 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#121214] border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">{niche.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted">
                    <span>{niche.category}</span>
                    <span>•</span>
                    <span className="text-primary">{niche.growth} Growth</span>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-muted" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted mb-2 text-sm">
                        <TrendingUp size={16} />
                        <span>Interest Score</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{niche.trending_score}/100</div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${niche.trending_score}%` }}></div>
                    </div>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted mb-2 text-sm">
                        <Target size={16} />
                        <span>Competition</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{niche.difficulty}</div>
                    <p className="text-xs text-muted mt-1">Based on content volume</p>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted mb-2 text-sm">
                        <BarChart size={16} />
                        <span>Est. CPM</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{niche.cpm}</div>
                    <p className="text-xs text-muted mt-1">Per 1,000 views</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Interest Over Time (7 Days)</h3>
                <div className="h-64 w-full bg-surface/50 rounded-xl p-4 border border-border">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
                                activeDot={{ r: 6, fill: '#fff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Top Keywords</h3>
                <div className="flex flex-wrap gap-2">
                    {niche.keywords.map((kw, i) => (
                        <div key={i} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-gray-300 flex items-center gap-2 group cursor-pointer hover:border-primary/50 transition-colors">
                            <span>#{kw}</span>
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

             <div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Analysis</h3>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-200 leading-relaxed">
                    This niche is currently experiencing a breakout moment due to recent algorithm shifts prioritizing high-retention content. 
                    Creators should focus on quick hooks in the first 3 seconds. The "{niche.title}" trend has high viral potential on TikTok 
                    specifically when paired with trending audio.
                </div>
            </div>

        </div>
        
        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-white transition-colors">
                Close
            </button>
            <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Check size={16} /> Save to Collection
            </button>
        </div>
      </div>
    </div>
  );
};