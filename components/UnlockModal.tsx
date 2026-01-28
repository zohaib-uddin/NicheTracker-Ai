
import React from 'react';
import { Lock, X } from 'lucide-react';

interface UnlockModalProps {
    onClose: () => void;
    onUpgrade: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ onClose, onUpgrade }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <Lock size={32} className="text-white" />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-white mb-2">Unlock every niche board</h2>
                <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                    Upgrade to Pro to explore the complete niche hierarchy and discover unlockable opportunities.
                </p>

                {/* Actions */}
                <div className="w-full space-y-3">
                    <button 
                        onClick={onUpgrade}
                        className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:scale-[1.02]"
                    >
                        Upgrade to Pro
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-white font-medium rounded-xl transition-colors"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
};
