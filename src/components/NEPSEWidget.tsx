import React, { useState, useEffect, useCallback } from 'react';

interface NEPSEData {
  index: number;
  change: string;
  isUp: boolean;
  date: string;
}

interface NEPSEWidgetProps {
  key?: string;
  variant?: 'ticker' | 'card' | 'dashboard';
  // Optional callback to lift state up so other pages can use the value
  onUpdate?: (data: NEPSEData) => void;
}

const DEFAULT_FALLBACK: NEPSEData = {
  index: 2847.12,
  change: "+12.45",
  isUp: true,
  date: "June 14, 2026"
};

export default function NEPSEWidget({ variant = 'card', onUpdate }: NEPSEWidgetProps) {
  const [data, setData] = useState<NEPSEData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatedTime, setUpdatedTime] = useState<string>('');

  const fetchNEPSEData = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
      }
      
      const url = isRetry ? '/api/nepse-live?simple=true' : '/api/nepse-live';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const payload = await response.json();
      
      let parsedIndex = typeof payload.index === 'number' ? payload.index : parseFloat(payload.index);
      let parsedChange = payload.change || "+0.00";
      let parsedIsUp = payload.isUp !== undefined ? payload.isUp : (parsedChange.startsWith('+') || parseFloat(parsedChange) >= 0);
      let parsedDate = payload.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      // Plausibility Check: Must be between 1000 and 5000
      if (isNaN(parsedIndex) || parsedIndex < 1000 || parsedIndex > 5000) {
        console.warn(`Implausible NEPSE value calculated: ${parsedIndex}. Reading mock backup.`);
        throw new Error("Implausible value");
      }

      const verifiedData: NEPSEData = {
        index: parsedIndex,
        change: parsedChange,
        isUp: parsedIsUp,
        date: parsedDate
      };

      setData(verifiedData);
      localStorage.setItem('ne_nepse_last', JSON.stringify(verifiedData));
      
      const now = new Date();
      setUpdatedTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLoading(false);

      if (onUpdate) {
        onUpdate(verifiedData);
      }

    } catch (error) {
      console.error("Error retrieving NEPSE data:", error);
      
      if (!isRetry) {
        // Wait 5 seconds, then retry once with simpler prompt
        console.log("Parsing failed or fetch failed. Initializing 5s simple lookup retry...");
        setTimeout(() => {
          fetchNEPSEData(true);
        }, 5000);
      } else {
        // Fallback to localStorage ne_nepse_last
        console.log("Simpler retry failed. Falling back to persistent localStorage cache.");
        const storedStr = localStorage.getItem('ne_nepse_last');
        let finalFallback = DEFAULT_FALLBACK;
        if (storedStr) {
          try {
            finalFallback = JSON.parse(storedStr);
          } catch {
            // Keep default
          }
        }
        setData(finalFallback);
        setUpdatedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
        if (onUpdate) {
          onUpdate(finalFallback);
        }
      }
    }
  }, [onUpdate]);

  useEffect(() => {
    fetchNEPSEData();
    // Refresh index every 30 minutes
    const interval = setInterval(() => {
      fetchNEPSEData();
    }, 1800000);

    return () => clearInterval(interval);
  }, [fetchNEPSEData]);

  // Shimmer Skeletons for Loading State
  if (loading || !data) {
    if (variant === 'ticker') {
      return (
        <span className="inline-flex items-center gap-1.5 animate-pulse text-gray-400 font-mono text-[11px] select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
          <span>📈 NEPSE INDEX: </span>
          <span className="h-3 w-16 bg-gray-700/60 rounded inline-block"></span>
        </span>
      );
    }
    
    if (variant === 'dashboard') {
      return (
        <div className="flex flex-col justify-center items-center text-center p-3 animate-pulse bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800">
          <div className="flex items-center gap-1.5 mb-2 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></div>
            <div className="h-3 w-16 bg-gray-250 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="h-7 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3.5 w-12 bg-gray-250 dark:bg-gray-800 rounded"></div>
        </div>
      );
    }

    // Default card outline shimmer
    return (
      <div className="w-full bg-white dark:bg-secondary-navy rounded-xl p-5 border border-border-warm dark:border-gray-800 shadow-premium animate-pulse flex flex-col justify-between h-[180px]">
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          </div>
          <div className="h-10 w-44 bg-gray-300 dark:bg-gray-700 rounded-lg mb-2"></div>
          <div className="h-4.5 w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="h-3.5 w-full bg-gray-200 dark:bg-gray-800 rounded mt-3"></div>
      </div>
    );
  }

  const isPositive = data.isUp;
  const arrow = isPositive ? '▲' : '▼';
  const colorClass = isPositive ? 'text-green-600 dark:text-green-500' : 'text-primary-crimson';

  if (variant === 'ticker') {
    return (
      <span className="inline-flex items-center gap-1 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
        <span>📈 NEPSE Index: </span>
        <span className="text-accent-gold font-bold font-mono">
          {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`${colorClass} font-bold ml-1`}>
          {arrow} {data.change}
        </span>
      </span>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="flex flex-col justify-center items-center text-center p-3 bg-white dark:bg-secondary-navy rounded-xl border border-border-warm dark:border-gray-800 shadow-sm relative overflow-hidden transition-all duration-200">
        <div className="flex items-center gap-1.5 mb-1.5 justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="AI Live updated" />
          <span className="text-xl shrink-0">📈</span>
          <span className="text-[11px] font-mono tracking-wider text-text-secondary uppercase dark:text-gray-400 font-bold">
            NEPSE Index
          </span>
        </div>
        
        <div className="text-xl sm:text-2xl font-mono text-primary-crimson dark:text-accent-gold font-bold">
          {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs">
          <span className={`inline-block ${isPositive ? 'text-green-600' : 'text-primary-crimson'} font-mono font-bold`}>
            {arrow} {data.change}
          </span>
          <span className="text-[10px] text-text-secondary dark:text-gray-400">vs Prev</span>
        </div>
      </div>
    );
  }

  // Large custom card layout format (Economy Page)
  return (
    <div className="bg-white dark:bg-secondary-navy p-6 rounded-xl border border-border-warm dark:border-gray-800 relative overflow-hidden text-left shadow-premium flex flex-col justify-between h-full min-h-[190px]">
      <div>
        <div className="flex justify-between items-start gap-1 mb-2.5 select-none">
          <h4 className="text-xs uppercase font-mono tracking-wider text-[#5A6475] dark:text-gray-400 font-black">
            📈 NEPSE INDEX
          </h4>
          <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 text-amber-500 font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
            GEMINI AI LIVE
          </span>
        </div>
        
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4.5xl font-mono text-primary-crimson dark:text-white font-extrabold tracking-tight">
            {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm sm:text-base font-mono font-black ${colorClass} flex items-center gap-0.5`}>
            {arrow} {data.change}
          </span>
        </div>

        <div className="text-[10.5px] text-text-secondary dark:text-gray-400 font-semibold mt-1">
          As of today: <span className="text-secondary-navy dark:text-accent-gold">{data.date}</span>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-border-warm dark:border-gray-800 flex justify-between items-center text-[10px] font-mono select-none">
        <div className="flex items-center gap-1 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#9A7B1C] dark:text-accent-gold px-2.5 py-1 rounded">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="font-bold">AI-Powered • Updated {updatedTime}</span>
        </div>
        <span className="text-gray-400 font-bold">REFRESH: 30M</span>
      </div>
    </div>
  );
}
