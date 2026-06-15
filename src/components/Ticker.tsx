import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketMetric } from '../types';
import NEPSEWidget from './NEPSEWidget';

interface TickerProps {
  metrics: MarketMetric[];
}

export default function Ticker({ metrics }: TickerProps) {
  // Separate NEPSE metrics and non-NEPSE metrics for neat scrolling
  const otherMetrics = metrics.filter(m => m.id !== '3');

  const renderMetricSegment = (m: MarketMetric) => {
    const colorClass = m.isUp ? 'text-green-500 font-bold' : 'text-primary-crimson font-bold';
    
    return (
      <span key={m.id} className="inline-flex items-center gap-1.5 font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
        <span>{m.name}: </span>
        <span className="text-accent-gold font-bold">{m.value}</span>
        <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
          {m.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{m.change}</span>
        </span>
      </span>
    );
  };

  return (
    <div className="w-full bg-secondary-navy text-white text-xs h-9 overflow-hidden flex items-center border-b border-border-warm/10 relative z-20 font-sans select-none">
      <div className="bg-primary-crimson text-white px-3 h-full flex items-center tracking-wider uppercase font-semibold text-[10px] select-none z-10 whitespace-nowrap shadow-md">
        LIVE MARKET TICKER
      </div>
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        {/* Continuous scroll loop containing both static indicators and NEPSE live widget */}
        <div className="whitespace-nowrap flex gap-12 font-mono animate-ticker py-1 select-none pr-12 text-gray-200 h-full items-center">
          <div className="flex gap-12 items-center pr-12">
            {otherMetrics.map(renderMetricSegment)}
            <NEPSEWidget variant="ticker" />
          </div>
          {/* Cloning segment for smooth loops */}
          <div className="flex gap-12 items-center pr-12" aria-hidden="true">
            {otherMetrics.map(renderMetricSegment)}
            <NEPSEWidget variant="ticker" />
          </div>
        </div>
      </div>
    </div>
  );
}
