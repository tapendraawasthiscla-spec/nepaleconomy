import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface NEPSEData {
  index: number;
  change: string;
  isUp: boolean;
  date: string;
}

interface NEPSEWidgetProps {
  variant?: 'ticker' | 'card' | 'dashboard';
  onUpdate?: (data: NEPSEData) => void;
  nepseData?: NEPSEData | null;
  loadingData?: boolean;
}

const DEFAULT_FALLBACK: NEPSEData = {
  index: 2847.12,
  change: "+12.45",
  isUp: true,
  date: "June 16, 2026"
};

// Illustrative historical points for sparkline render
const SPARKLINE_POINTS = [2821.10, 2814.30, 2835.40, 2822.00, 2843.80, 2831.50, 2847.12];

export default function NEPSEWidget({ variant = 'card', onUpdate, nepseData, loadingData }: NEPSEWidgetProps) {
  const [data, setData] = useState<NEPSEData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatedTime, setUpdatedTime] = useState<string>('');

  // Handle prop injection to bypass local fetching when supplied
  useEffect(() => {
    if (nepseData !== undefined) {
      setData(nepseData);
      setLoading(loadingData !== undefined ? loadingData : !nepseData);
      if (nepseData) {
        setUpdatedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }
  }, [nepseData, loadingData]);

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
      
      const parsedIndex = typeof payload.index === 'number' ? payload.index : parseFloat(payload.index);
      const parsedChange = payload.change || "+0.00";
      const parsedIsUp = payload.isUp !== undefined ? payload.isUp : (parsedChange.startsWith('+') || parseFloat(parsedChange) >= 0);
      const parsedDate = payload.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      if (isNaN(parsedIndex) || parsedIndex < 500 || parsedIndex > 5000) {
        throw new Error("Implausible value range");
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
      console.warn("NEPSE live api retrieval error, applying fallback state:", error);
      
      if (!isRetry) {
        setTimeout(() => {
          fetchNEPSEData(true);
        }, 1500);
      } else {
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
    if (nepseData !== undefined) {
      return;
    }
    fetchNEPSEData();
    const interval = setInterval(() => {
      fetchNEPSEData();
    }, 1800000); // 30 mins interval

    return () => clearInterval(interval);
  }, [fetchNEPSEData, nepseData]);

  if (loading || !data) {
    if (variant === 'ticker') {
      return (
        <span className="inline-flex items-center gap-1.5 animate-pulse text-gray-400 font-mono text-[11px] select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
          <span>📈 NEPSE INDEX: </span>
          <span className="h-3 w-16 bg-nexus-border/60 rounded inline-block"></span>
        </span>
      );
    }
    
    return (
      <div className="w-full bg-nexus-card rounded-xl p-5 border border-nexus-border shadow-premium animate-pulse flex flex-col justify-between h-[180px]">
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 w-24 bg-nexus-border rounded"></div>
            <div className="h-5 w-20 bg-nexus-border rounded-full"></div>
          </div>
          <div className="h-10 w-44 bg-nexus-border rounded-lg mb-2"></div>
        </div>
        <div className="h-3 w-full bg-nexus-border rounded"></div>
      </div>
    );
  }

  const isPositive = data.isUp;
  const arrow = isPositive ? '▲' : '▼';
  const colorClass = isPositive ? 'text-nexus-green' : 'text-danger-red';
  const strokeColor = isPositive ? '#00E5A0' : '#FF3D57';

  if (variant === 'ticker') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-nexus-green animate-pulse mr-1"></span>
        <span>📈 NEPSE INDEX: </span>
        <span className="text-nexus-cyan font-bold">
          {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`${colorClass} font-bold ml-1 flex items-center`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 block inline" /> : <ArrowDownRight className="w-3 h-3 block inline" />}
          <span>{data.change}</span>
        </span>
      </span>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="flex flex-col justify-center items-center text-center p-3.5 bg-nexus-card rounded-xl border border-nexus-border shadow-premium relative overflow-hidden transition-all duration-200 text-left">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-nexus-cyan pulsing-live shrink-0" />
          <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-black">
            NEPSE INDEX (LIVE)
          </span>
        </div>
        
        <div className="text-xl sm:text-2xl font-serif font-black text-white leading-none">
          {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        <div className="flex items-center gap-1 mt-1 text-[11px] select-none">
          <span className={`inline-block ${colorClass} font-mono font-bold flex items-center`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : <ArrowDownRight className="w-3.5 h-3.5 inline" />}
            <span>{data.change}</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono">VS PREV</span>
        </div>
      </div>
    );
  }

  // Draw customized SVG dynamic sparkles
  const minVal = Math.min(...SPARKLINE_POINTS) * 0.999;
  const maxVal = Math.max(...SPARKLINE_POINTS) * 1.001;
  const range = maxVal - minVal;
  
  const widthSvg = 300;
  const heightSvg = 60;
  const pointsStr = SPARKLINE_POINTS.map((v, i) => {
    const x = (i / (SPARKLINE_POINTS.length - 1)) * (widthSvg - 10) + 5;
    const y = heightSvg - ((v - minVal) / range) * (heightSvg - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-nexus-card p-6 rounded-xl border border-nexus-border relative overflow-hidden text-left shadow-premium flex flex-col justify-between h-full min-h-[220px] select-none text-left">
      <div className="text-left space-y-3">
        <div className="flex justify-between items-start gap-1 select-none text-left leading-none">
          <div className="flex items-center gap-1.5 text-left">
            <Activity className="w-4 h-4 text-nexus-cyan animate-pulse shrink-0" />
            <span className="text-[10.5px] uppercase font-mono tracking-widest text-gray-400 font-bold">
              NEPSE INDEX (LIVE STATS)
            </span>
          </div>
          <span className="inline-flex bg-nexus-cyan/10 border border-nexus-cyan/25 text-nexus-cyan font-mono text-[9px] px-2 py-0.5 rounded-full font-bold select-none uppercase">
            SECURE TICKER
          </span>
        </div>
        
        <div className="flex items-baseline gap-2.5 text-left leading-none">
          <span className="text-2.5xl sm:text-3.5xl font-mono text-white font-extrabold tracking-tight">
            {data.index.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-[12px] sm:text-xs font-mono font-bold ${colorClass} flex items-center gap-0.5 self-center`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{data.change}</span>
          </span>
        </div>

        {/* SVG Sparkline */}
        <div className="w-full pt-2">
          <svg className="w-full" viewBox={`0 0 ${widthSvg} ${heightSvg}`} style={{ display: 'block', maxHeight: '60px' }}>
            <defs>
              <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Sparkline glow area */}
            <path
              d={`M5,${heightSvg} L${pointsStr} L${widthSvg - 5},${heightSvg} Z`}
              fill="url(#glowGrad)"
            />
            {/* Sparkline line */}
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              points={pointsStr}
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-nexus-border/60 flex justify-between items-center text-[10px] font-mono select-none">
        <div className="flex items-center gap-1 bg-nexus-cyan/10 border border-nexus-cyan/20 text-nexus-cyan px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 bg-nexus-green pulsing-live rounded-full shrink-0"></span>
          <span className="font-bold">{updatedTime ? `Sync: ${updatedTime}` : 'Buffering...'}</span>
        </div>
        <span className="text-gray-500 font-bold">INTERVAL: 30M</span>
      </div>
    </div>
  );
}
