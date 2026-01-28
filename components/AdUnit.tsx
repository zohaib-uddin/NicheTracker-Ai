
import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  layoutKey?: string; // For In-feed ads
  style?: React.CSSProperties;
  className?: string;
  label?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
    slot, 
    format = 'auto', 
    layoutKey, 
    style, 
    className = "",
    label = "Advertisement"
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isDev = false; // Set to true to see placeholders in local dev if adblock is on

  useEffect(() => {
    try {
        const win = window as any;
        if (win.adsbygoogle) {
            win.adsbygoogle.push({});
        }
    } catch (e: any) {
      // Suppress "No slot size" errors which happen when container is too small (e.g. mobile hidden divs or initial layout shift)
      if (e.message && e.message.includes('No slot size')) {
          console.warn("AdSense sized out (harmless):", e.message);
      } else {
          console.error("AdSense Push Error:", e);
      }
    }
  }, []);

  return (
    <div className={`ad-wrapper w-full my-6 flex flex-col items-center justify-center bg-transparent ${className}`} style={{ minHeight: format === 'horizontal' ? '90px' : '280px' }}>
      <div className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1 select-none">
        {label}
      </div>
      
      {isDev ? (
          <div className="w-full h-full bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded flex items-center justify-center text-xs text-muted p-4">
              AD SPACE: {slot} ({format})
          </div>
      ) : (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', ...style }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // REPLACE WITH YOUR ID
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
            data-ad-layout-key={layoutKey}
          />
      )}
    </div>
  );
};
