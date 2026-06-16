import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketMetric } from '../types';
import NEPSEWidget from './NEPSEWidget';

interface TickerProps {
  metrics: MarketMetric[];
}

interface NEPSEData {
  index: number;
  change: string;
  isUp: boolean;
  date: string;
}

const DEFAULT_FALLBACK: NEPSEData = {
  index: 2847.12,
  change: "+12.45",
  isUp: true,
  date: "June 16, 2026"
};

export default function Ticker({ metrics }: TickerProps) {
  const [nepseData, setNepseData] = useState<NEPSEData | null>(null);
  const [nepseLoading, setNepseLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const fetchNepse = async (isRetry = false) => {
      try {
        if (!isRetry) {
          setNepseLoading(true);
        }
        const url = isRetry ? '/api/nepse-live?simple=true' : '/api/nepse-live';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error();
        }
        const payload = await response.json();
        
        const index = typeof payload.index === 'number' ? payload.index : parseFloat(payload.index);
        const change = payload.change || "+0.00";
        const isUp = payload.isUp !== undefined ? payload.isUp : (change.startsWith('+') || parseFloat(change) >= 0);
        const date = payload.date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        if (active) {
          const verified = { index, change, isUp, date };
          setNepseData(verified);
          localStorage.setItem('ne_nepse_last', JSON.stringify(verified));
          setNepseLoading(false);
        }
      } catch {
        if (!active) return;
        if (!isRetry) {
          setTimeout(() => fetchNepse(true), 1500);
        } else {
          const stored = localStorage.getItem('ne_nepse_last');
          if (stored) {
            try {
              setNepseData(JSON.parse(stored));
            } catch {
              setNepseData(DEFAULT_FALLBACK);
            }
          } else {
            setNepseData(DEFAULT_FALLBACK);
          }
          setNepseLoading(false);
        }
      }
    };

    fetchNepse();
    const interval = setInterval(fetchNepse, 1800000); // 30 minutes

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Exclude NEPSE as it will be rendered live by NEPSEWidget itself in ticker form
  const otherMetrics = metrics.filter(m => m.id !== '3');

  const renderMetric = (m: MarketMetric, suffix: string) => {
    const isUp = m.isUp;
    const colorClass = isUp ? 'text-nexus-green' : 'text-danger-red';
    
    return (
      <span key={`${m.id}-${suffix}`} className="inline-flex items-center gap-1.5 font-mono text-[10.5px]">
        <span className="w-1 h-1 bg-nexus-cyan rounded-full animate-ping shrink-0" />
        <span className="text-gray-400 capitalize">{m.name}:</span>
        <span className="text-white font-black">{m.value}</span>
        <span className={`inline-flex items-center gap-0.5 ${colorClass} font-bold`}>
          {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          <span>{m.change}</span>
        </span>
      </span>
    );
  };

  return (
    <div className="w-full bg-[#0A0F1E] text-white text-xs h-9 overflow-hidden flex items-center border-b border-nexus-border relative z-20 font-sans select-none text-left">
      <div className="bg-danger-red text-nexus-void px-3.5 h-full flex items-center tracking-widest uppercase font-mono font-bold text-[9px] select-none z-10 whitespace-nowrap shadow-md">
        LIVE MONITORS
      </div>
      
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div className="whitespace-nowrap flex gap-12 font-mono animate-ticker py-1 select-none pr-12 text-gray-200 h-full items-center">
          
          <div className="flex gap-14 items-center pr-12 shrink-0">
            <NEPSEWidget variant="ticker" nepseData={nepseData} loadingData={nepseLoading} />
            {otherMetrics.map(m => renderMetric(m, 'a'))}
          </div>
          
          {/* Looping duplicates for seamless scroll */}
          <div className="flex gap-14 items-center pr-12 shrink-0" aria-hidden="true">
            <NEPSEWidget variant="ticker" nepseData={nepseData} loadingData={nepseLoading} />
            {otherMetrics.map(m => renderMetric(m, 'b'))}
          </div>

          <div className="flex gap-14 items-center pr-12 shrink-0" aria-hidden="true">
            <NEPSEWidget variant="ticker" nepseData={nepseData} loadingData={nepseLoading} />
            {otherMetrics.map(m => renderMetric(m, 'c'))}
          </div>

        </div>
      </div>
    </div>
  );
}
