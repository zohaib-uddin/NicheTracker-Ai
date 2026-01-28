
import React from 'react';
import { NicheData } from '../types';
import { FolderOpen } from 'lucide-react';
import { NicheCard } from './NicheCard';
import { AdUnit } from './AdUnit';

interface SavedNichesProps {
  niches: NicheData[];
  savedIds: string[]; // passed from App state
  onView: (niche: NicheData) => void;
  onToggleSave: (id: string, data: NicheData) => void;
  isAdmin?: boolean; // New Prop
  onDelete?: (id: string) => void; // New Prop
}

export const SavedNiches: React.FC<SavedNichesProps> = ({ niches, savedIds, onView, onToggleSave, isAdmin, onDelete }) => {
  // Filter niches based on the IDs stored in App state (DB + LocalStorage)
  const filteredNiches = niches.filter(n => savedIds.includes(n.id));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Saved Collection</h1>
                <p className="text-muted text-sm md:text-base">Your curated list of viral candidates and favorite niches.</p>
            </div>
            <div className="text-sm text-muted font-medium bg-surface px-4 py-2 rounded-lg border border-border">
                {filteredNiches.length} Saved Items
            </div>
        </div>

        {/* TOP AD UNIT */}
        <AdUnit slot="saved-top-slot" format="horizontal" />

        {/* GRID LAYOUT (Clean & New) */}
        {filteredNiches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredNiches.map((niche) => (
                    <div key={niche.id} className="relative group">
                        <NicheCard 
                            data={niche} 
                            onClick={() => onView(niche)} 
                            isSaved={true}
                            onToggleSave={onToggleSave}
                            isAdmin={isAdmin}
                            onDelete={onDelete}
                        />
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-border rounded-3xl bg-surface/30 m-4">
                <div className="p-4 bg-surface border border-border rounded-full shadow-xl mb-4">
                   <FolderOpen size={32} className="text-muted" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                    Collection is Empty
                </h3>
                <p className="text-muted max-w-sm mx-auto text-sm md:text-base">
                    Click the bookmark icon on any video card to save it here for later analysis.
                </p>
            </div>
        )}

        {/* BOTTOM AD UNIT */}
        <AdUnit slot="saved-bottom-slot" format="horizontal" />

    </div>
  );
};
