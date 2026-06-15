import React, { useState, useEffect } from 'react';
import { Calendar, Activity, RefreshCw } from 'lucide-react';

const years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

interface MetricConfig {
  yZero: number;
  scale: number;
  unit: string;
  yLabels: { y: number; text: string }[];
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  gdp: {
    yZero: 135,
    scale: 12,
    unit: '%',
    yLabels: [
      { y: 39, text: '8%' },   // 135 - 8 * 12 = 39
      { y: 87, text: '4%' },   // 135 - 4 * 12 = 87
      { y: 135, text: '0%' },  // 135 - 0 * 12 = 135
      { y: 171, text: '-3%' }  // 135 + 3 * 12 = 171
    ],
  },
  inflation: {
    yZero: 160,
    scale: 16,
    unit: '%',
    yLabels: [
      { y: 32, text: '8%' },   // 160 - 8 * 16 = 32
      { y: 96, text: '4%' },   // 160 - 4 * 16 = 96
      { y: 160, text: '0%' }   // 160
    ]
  },
  npr: {
    yZero: 165,
    scale: 1.0,
    unit: 'Rs.',
    yLabels: [
      { y: 25, text: '140' },  // 165 - 140 * 1.0 = 25
      { y: 65, text: '100' },  // 165 - 100 * 1.0 = 65
      { y: 115, text: '50' },  // 165 - 50 * 1.0 = 115
      { y: 165, text: '0' }    // 165 - 0 = 165
    ]
  },
  trade: {
    yZero: 160,
    scale: 10,
    unit: '$B',
    yLabels: [
      { y: 20, text: '$14B' }, // 160 - 14 * 10 = 20
      { y: 60, text: '$10B' }, // 160 - 10 * 10 = 60
      { y: 110, text: '$5B' }, // 160 - 5 * 10 = 110
      { y: 160, text: '$0' }   // 160
    ]
  }
};

const historicalHighlights: Record<string, string> = {
  '2018': 'Robust post-earthquake reconstruction boom and peak tourist arrivals bolster domestic growth.',
  '2019': 'Sustained secondary sector expansion and improved dry-port supply logistics.',
  '2020': 'Global pandemic shutdowns hit service sectors; massive tourism drop offset by resilient remittances.',
  '2021': 'Aggressive banking credit expansion post-lockdown causes sharp real estate activity surge.',
  '2022': 'Soaring global commodity prices deplete net reserves, driving import restriction mandates.',
  '2023': 'Central bank credit controls stabilize the NPR but decelerate commercial investment.',
  '2024': 'Milestone electricity export volumes to India significantly narrow current account deficits.',
  '2025': 'Preliminary estimate: Hydropower exports and tourism recovery drive moderate growth'
};

export default function InteractiveChart() {
  const [selectedMetric, setSelectedMetric] = useState<string>('gdp');
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(7); // Default to latest estimates (2025)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Microeconomic records with robust local fallback defaults
  const [gdpData, setGdpData] = useState<Record<string, number>>({
    '2018': 6.7, '2019': 6.6, '2020': -2.4, '2021': 4.8, '2022': 5.3, '2023': 3.9, '2024': 4.2, '2025': 4.5
  });

  const [inflationData, setInflationData] = useState<Record<string, number>>({
    '2018': 4.2, '2019': 4.6, '2020': 6.1, '2021': 3.6, '2022': 6.3, '2023': 7.7, '2024': 6.8, '2025': 5.4
  });

  const [nprData, setNprData] = useState<Record<string, number>>({
    '2018': 107.50, '2019': 113.20, '2020': 118.60, '2021': 119.50, '2022': 125.30, '2023': 130.20, '2024': 133.40, '2025': 134.50
  });

  const [tradeData] = useState<Record<string, number>>({
    '2018': 10.2, '2019': 11.1, '2020': 8.4, '2021': 12.8, '2022': 13.9, '2023': 11.8, '2024': 11.2, '2025': 12.1
  });

  useEffect(() => {
    let isMounted = true;

    const fetchMacroData = async () => {
      try {
        // World Bank GDP (NY.GDP.MKTP.KD.ZG)
        const gdpUrl = 'https://api.worldbank.org/v2/country/NPL/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=8';
        const gdpPromise = fetch(gdpUrl)
          .then(res => res.json())
          .catch(() => null);

        // World Bank Inflation (FP.CPI.TOTL.ZG)
        const infUrl = 'https://api.worldbank.org/v2/country/NPL/indicator/FP.CPI.TOTL.ZG?format=json&mrv=8';
        const infPromise = fetch(infUrl)
          .then(res => res.json())
          .catch(() => null);

        // ExchangeRate NPR USD
        const exUrl = 'https://open.er-api.com/v6/latest/USD';
        const exPromise = fetch(exUrl)
          .then(res => res.json())
          .catch(() => null);

        const [gdpRes, infRes, exRes] = await Promise.all([gdpPromise, infPromise, exPromise]);

        if (!isMounted) return;

        if (gdpRes && gdpRes[1]) {
          setGdpData(prev => {
            const updated = { ...prev };
            gdpRes[1].forEach((item: any) => {
              if (item.date && years.includes(item.date) && item.value !== null) {
                updated[item.date] = Number(item.value.toFixed(2));
              }
            });
            return updated;
          });
        }

        if (infRes && infRes[1]) {
          setInflationData(prev => {
            const updated = { ...prev };
            infRes[1].forEach((item: any) => {
              if (item.date && years.includes(item.date) && item.value !== null) {
                updated[item.date] = Number(item.value.toFixed(2));
              }
            });
            return updated;
          });
        }

        if (exRes && exRes.rates && exRes.rates.NPR) {
          setNprData(prev => ({
            ...prev,
            '2025': Number(exRes.rates.NPR.toFixed(2))
          }));
        }

        // Apply successful timestamp updates
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const minVal = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        setLastUpdated(`${yyyy}-${mm}-${dd} ${hh}:${minVal}:${ss}`);

      } catch (error) {
        console.error("Macro api requests completed with errors, utilizing fallbacks", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMacroData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedYear = years[selectedYearIndex];

  // Map selection to active dataset values
  const getActiveDataset = () => {
    switch (selectedMetric) {
      case 'gdp': return gdpData;
      case 'inflation': return inflationData;
      case 'npr': return nprData;
      case 'trade': return tradeData;
      default: return gdpData;
    }
  };

  const activeData = getActiveDataset();
  const activeValue = activeData[selectedYear];

  // Metric value formatters
  const formatValue = (val: number, type: string) => {
    if (type === 'gdp') return val > 0 ? `+${val}%` : `${val}%`;
    if (type === 'inflation') return `${val}%`;
    if (type === 'npr') return `Rs. ${val.toFixed(2)}`;
    if (type === 'trade') return `$${val}B`;
    return String(val);
  };

  const formatValueShort = (val: number, type: string) => {
    if (type === 'gdp') return val > 0 ? `+${val}%` : `${val}%`;
    if (type === 'inflation') return `${val}%`;
    if (type === 'npr') return `${val.toFixed(1)}`;
    if (type === 'trade') return `$${val}B`;
    return String(val);
  };

  const getMetricLabel = (type: string) => {
    if (type === 'gdp') return 'GDP Growth';
    if (type === 'inflation') return 'Inflation';
    if (type === 'npr') return 'NPR/USD Rate';
    if (type === 'trade') return 'Trade Deficit';
    return '';
  };

  // Companion info dynamic calculation helpers
  const getCompanion1Label = () => {
    switch (selectedMetric) {
      case 'gdp': return 'Avg Inflation Rate';
      case 'inflation': return 'Real GDP Growth';
      case 'npr': return 'Real GDP Growth';
      case 'trade': return 'Real GDP Growth';
      default: return '';
    }
  };

  const getCompanion1Value = () => {
    switch (selectedMetric) {
      case 'gdp': return `${inflationData[selectedYear]}%`;
      case 'inflation': return gdpData[selectedYear] > 0 ? `+${gdpData[selectedYear]}%` : `${gdpData[selectedYear]}%`;
      case 'npr': return gdpData[selectedYear] > 0 ? `+${gdpData[selectedYear]}%` : `${gdpData[selectedYear]}%`;
      case 'trade': return gdpData[selectedYear] > 0 ? `+${gdpData[selectedYear]}%` : `${gdpData[selectedYear]}%`;
      default: return '';
    }
  };

  const getCompanion2Label = () => {
    switch (selectedMetric) {
      case 'gdp': return 'BoT Trade Deficit';
      case 'inflation': return 'NPR/USD Exchange Rate';
      case 'npr': return 'Avg Inflation Rate';
      case 'trade': return 'Avg Inflation Rate';
      default: return '';
    }
  };

  const getCompanion2Value = () => {
    switch (selectedMetric) {
      case 'gdp': return `$${tradeData[selectedYear]}B`;
      case 'inflation': return `Rs. ${nprData[selectedYear].toFixed(2)}`;
      case 'npr': return `${inflationData[selectedYear]}%`;
      case 'trade': return `${inflationData[selectedYear]}%`;
      default: return '';
    }
  };

  // Dimensions of SVG responsive viewport
  const height = 200;
  const width = 360;
  const padding = 28;
  const chartAreaWidth = width - padding * 2;
  const numBars = years.length;
  const barWidth = (chartAreaWidth / numBars) * 0.7;

  const currentConfig = METRIC_CONFIGS[selectedMetric] || METRIC_CONFIGS.gdp;
  const { yZero, scale, yLabels } = currentConfig;

  return (
    <div className="bg-dark-navy text-white rounded-xl p-6 border border-accent-gold/20 shadow-premium flex flex-col justify-between h-full">
      <div>
        {/* Metric Selector Row (Step 1 Requirement) */}
        <div className="flex bg-secondary-navy border border-accent-gold/10 p-1 rounded-lg text-xs select-none gap-1 mb-5 w-full flex-wrap sm:flex-nowrap">
          {[
            { id: 'gdp', label: 'GDP Growth' },
            { id: 'inflation', label: 'Inflation' },
            { id: 'npr', label: 'NPR/USD Rate' },
            { id: 'trade', label: 'Trade Deficit' }
          ].map((metric) => (
            <button
              key={metric.id}
              type="button"
              id={`metric-btn-${metric.id}`}
              onClick={() => setSelectedMetric(metric.id)}
              className={`flex-1 py-1.5 px-2 rounded font-mono font-bold text-[9px] uppercase tracking-wider transition-all duration-200 text-center cursor-pointer ${
                selectedMetric === metric.id
                  ? 'bg-primary-crimson text-white shadow-md border-b-2 border-accent-gold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>

        {/* Title and Metadata Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="text-left">
            <div className="flex items-center gap-1.5 text-accent-gold font-mono text-[11px] tracking-widest uppercase mb-1 font-bold">
              <Activity className="w-3.5 h-3.5 text-accent-gold" />
              <span>MACROECONOMIC MONITORING DATABASE</span>
            </div>

            {/* Timestamp Display */}
            {lastUpdated && (
              <div id="chart-timestamp" className="text-[9.5px] font-mono text-gray-500 font-bold mb-1 tracking-wider uppercase flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 text-emerald-500 animate-spin-slow" />
                <span>LAST UPDATED: </span>
                <span className="text-emerald-500">{lastUpdated}</span>
              </div>
            )}

            <h3 id="chart-main-title" className="text-lg sm:text-xl font-serif font-bold text-gray-100 leading-tight">
              {selectedMetric === 'gdp' && "Annual Real GDP Growth"}
              {selectedMetric === 'inflation' && "Consumer Price Inflation"}
              {selectedMetric === 'npr' && "NPR / USD Exchange Benchmark"}
              {selectedMetric === 'trade' && "Balance of Trade (BoT) Deficits"}
            </h3>
            <p className="text-xs text-gray-405 font-sans mt-0.5">
              Historical performance (2018 – 2025) and structural drivers
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-block bg-primary-crimson/30 hover:bg-primary-crimson/50 text-accent-gold text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-accent-gold/20 select-none">
              Live API
            </span>
          </div>
        </div>

        {/* Dynamic Highlight Snapshot Card */}
        <div id="snapshot-card" className="bg-secondary-navy/95 p-3.5 rounded-lg border border-accent-gold/10 mb-5 min-h-[140px] transition-all duration-300">
          <div className="flex justify-between items-center text-xs font-semibold mb-2 border-b border-gray-800 pb-2">
            <span className="text-accent-gold font-serif flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>FY {selectedYear} Snapshot</span>
            </span>
            <span id="snapshot-val" className="font-mono text-gray-200 bg-black/40 px-2 py-0.5 rounded font-bold border border-white/5 text-[11px]">
              {getMetricLabel(selectedMetric)}: {formatValue(activeValue, selectedMetric)}
            </span>
          </div>

          <p id="snapshot-note" className="text-[12px] leading-snug text-gray-300 font-sans mb-3 text-left font-light">
            {historicalHighlights[selectedYear]}
          </p>

          {/* Peer companion rates row inside snapshot */}
          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-800/40 text-left">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-tight">{getCompanion1Label()}</span>
              <span id="companion-metric-1" className="font-mono text-xs text-white font-bold">{getCompanion1Value()}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase font-mono tracking-tight">{getCompanion2Label()}</span>
              <span id="companion-metric-2" className="font-mono text-xs text-white font-bold">{getCompanion2Value()}</span>
            </div>
          </div>
        </div>

        {/* Shimmer Skeleton or Rendered Custom SVG */}
        {isLoading ? (
          <div id="chart-shimmer" className="h-[200px] flex items-end justify-between px-6 pt-10 pb-4 bg-secondary-navy/40 rounded-lg animate-pulse border border-accent-gold/5 my-2">
            {[45, 65, 30, 75, 55, 90, 80, 60].map((heightPct, index) => (
              <div
                key={index}
                style={{ height: `${heightPct}%` }}
                className="w-[22px] bg-gray-700/40 rounded"
              />
            ))}
          </div>
        ) : (
          <div className="relative my-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              {/* Gradients */}
              <defs>
                <linearGradient id="barGradUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C0001A" />
                  <stop offset="100%" stopColor="#8B0000" />
                </linearGradient>
                <linearGradient id="barGradDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B0000" />
                  <stop offset="100%" stopColor="#C0001A" />
                </linearGradient>
                <linearGradient id="barGradGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#9A7B1C" />
                </linearGradient>
              </defs>

              {/* Zero/Baseline Axes Grid */}
              <line
                x1={padding}
                y1={yZero}
                x2={width - padding}
                y2={yZero}
                stroke="#5A6475"
                strokeWidth="1.2"
                strokeDasharray="2"
              />

              {/* Gridlines of custom Metric labels */}
              {yLabels.map((lbl, idx) => (
                <g key={idx}>
                  {/* Gridline label */}
                  <text
                    x={padding - 6}
                    y={lbl.y + 3}
                    fill="#5A6475"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {lbl.text}
                  </text>
                  {/* Subtle alignment rule */}
                  <line
                    x1={padding}
                    y1={lbl.y}
                    x2={width - padding}
                    y2={lbl.y}
                    stroke="#5A6475"
                    strokeOpacity="0.12"
                    strokeWidth="0.6"
                  />
                </g>
              ))}

              {/* Bars render loops */}
              {years.map((year, index) => {
                const itemValue = activeData[year] || 0;

                // Calculate x offset accurately
                const slotWidth = chartAreaWidth / numBars;
                const x = padding + (index * slotWidth) + (slotWidth - barWidth) / 2;

                // Value mapping heights
                let barHeight = itemValue * scale;
                let y = yZero - barHeight;

                if (itemValue < 0) {
                  y = yZero;
                  barHeight = Math.abs(itemValue) * scale;
                }

                const isSelected = selectedYearIndex === index;
                const is2025 = year === '2025';

                return (
                  <g
                    key={year}
                    id={`bar-group-${year}`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedYearIndex(index)}
                  >
                    {/* Interactive broader tap box */}
                    <rect
                      x={x - 4}
                      y={10}
                      width={barWidth + 8}
                      height={height - 25}
                      fill="transparent"
                    />

                    {/* Active Column Backdrop overlay */}
                    {isSelected && (
                      <rect
                        x={x - 3}
                        y={15}
                        width={barWidth + 6}
                        height={height - padding - 20}
                        fill="rgba(212, 175, 55, 0.08)"
                        rx="4"
                        stroke="rgba(212, 175, 55, 0.2)"
                        strokeWidth="1"
                      />
                    )}

                    {/* Physical bar graphic */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2.5)}
                      fill={isSelected ? 'url(#barGradGold)' : 'url(#barGradUp)'}
                      rx="1.5"
                      stroke={is2025 ? (isSelected ? '#D4AF37' : '#C0001A') : 'none'}
                      strokeWidth={is2025 ? 1.5 : 0}
                      strokeDasharray={is2025 ? '3,3' : undefined}
                      className="transition-all duration-300 group-hover:opacity-90"
                    />

                    {/* Numeric overhead label */}
                    <text
                      x={x + barWidth / 2}
                      y={itemValue >= 0 ? y - 6 : yZero + barHeight + 11}
                      fill={isSelected ? '#D4AF37' : '#E2E0DA'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {formatValueShort(itemValue, selectedMetric)}
                    </text>

                    {/* 2025 Estimate Label inside Chart */}
                    {is2025 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 18}
                        fill="#D4AF37"
                        fontSize="7"
                        fontStyle="italic"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-sans"
                      >
                        Est.
                      </text>
                    )}

                    {/* Fiscal Year benchmark axis labels */}
                    <text
                      x={x + barWidth / 2}
                      y={height - 7}
                      fill={isSelected ? '#D4AF37' : '#5A6475'}
                      fontSize="9.5"
                      fontFamily="sans-serif"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {year}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Auxiliary Stats section at the bottom */}
      <div id="auxiliary-stats-grid" className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-accent-gold/10 text-xs text-left">
        <div>
          <span id="aux-label-1" className="text-gray-400 block font-sans font-medium">{getCompanion1Label()}</span>
          <span id="aux-val-1" className="font-mono text-gray-100 font-bold">{getCompanion1Value()}</span>
        </div>
        <div>
          <span id="aux-label-2" className="text-gray-400 block font-sans font-medium">{getCompanion2Label()}</span>
          <span id="aux-val-2" className="font-mono text-gray-100 font-bold">{getCompanion2Value()}</span>
        </div>
      </div>

      <div className="mt-3 text-[9.5px] text-center text-gray-400 font-sans italic select-none">
        *Click columns to investigate chronological economic shocks, data sources, and preliminary 2025 highlights.
      </div>
    </div>
  );
}
