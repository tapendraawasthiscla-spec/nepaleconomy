// Live data utility functions for NepalEconomy.com matching Bloomberg quality
// Calls real external public APIs and handles errors gracefully with fallbacks

export async function fetchLiveForexRate(): Promise<string> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) {
    throw new Error('Failed to fetch NPR exchange rate');
  }
  const data = await res.json();
  const nprRate = data.rates?.NPR;
  if (!nprRate) {
    throw new Error('NPR rate not found in USD rates payload');
  }
  return nprRate.toFixed(2);
}

export async function fetchNepalEconomyIndicators(): Promise<string> {
  // NY.GDP.MKTP.KD.ZG represents GDP growth (annual %) for Nepal
  const res = await fetch('https://api.worldbank.org/v2/country/NPL/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=1');
  if (!res.ok) {
    throw new Error('Failed to fetch Nepal GDP growth indicator');
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
    throw new Error('Invalid World Bank payload structure');
  }
  const val = data[1][0]?.value;
  if (val === null || val === undefined) {
    throw new Error('GDP growth rate value is null/undefined');
  }
  return `${Number(val).toFixed(1)}%`;
}

export async function fetchLiveInflation(): Promise<string> {
  // FP.CPI.TOTL.ZG represents inflation (% annual)
  const res = await fetch('https://api.worldbank.org/v2/country/NPL/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1');
  if (!res.ok) {
    throw new Error('Failed to fetch Nepal inflation rate');
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
    throw new Error('Invalid World Bank CPI payload structure');
  }
  const val = data[1][0]?.value;
  if (val === null || val === undefined) {
    throw new Error('Inflation value is null/undefined');
  }
  return `${Number(val).toFixed(1)}%`;
}

export async function fetchLiveForeignReserves(): Promise<string> {
  // FI.RES.TOTL.CD represents total reserves (includes gold, current US$)
  const res = await fetch('https://api.worldbank.org/v2/country/NPL/indicator/FI.RES.TOTL.CD?format=json&mrv=1');
  if (!res.ok) {
    throw new Error('Failed to fetch Nepal foreign reserves');
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
    throw new Error('Invalid World Bank reserves payload structure');
  }
  const val = data[1][0]?.value;
  if (val === null || val === undefined) {
    throw new Error('Reserves value is null/undefined');
  }
  const billions = Number(val) / 1000000000;
  return `$${billions.toFixed(1)}B`;
}

export async function fetchLiveNRBInterest(): Promise<string> {
  try {
    // FR.INR.DPST represents deposit interest rate (%)
    const res = await fetch('https://api.worldbank.org/v2/country/NPL/indicator/FR.INR.DPST?format=json&mrv=1');
    if (!res.ok) {
      console.warn('World Bank interest rate proxy HTTP request failed, using default 5.5%');
      return '5.5%';
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
      console.warn('Invalid World Bank interest rate payload structure, using default 5.5%');
      return '5.5%';
    }
    const val = data[1][0]?.value;
    if (val === null || val === undefined) {
      console.warn('World Bank interest rate indicator value is null/undefined, using default 5.5%');
      return '5.5%';
    }
    return `${Number(val).toFixed(1)}%`;
  } catch (error) {
    console.warn('Error fetching Live NRB Interest, using standard fallback 5.5%:', error);
    return '5.5%';
  }
}

export async function fetchLiveRemittance(): Promise<string> {
  // BX.TRF.PWKR.CD.DT represents personal remittances received (current US$)
  const res = await fetch('https://api.worldbank.org/v2/country/NPL/indicator/BX.TRF.PWKR.CD.DT?format=json&mrv=1');
  if (!res.ok) {
    throw new Error('Failed to fetch Nepal remittance inflows');
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1]) || data[1].length === 0) {
    throw new Error('Invalid World Bank remittance payload structure');
  }
  const val = data[1][0]?.value;
  if (val === null || val === undefined) {
    throw new Error('Remittance value is null/undefined');
  }
  const billions = Number(val) / 1000000000;
  return `$${billions.toFixed(1)}B`;
}

export async function fetchNEPSEFromGemini(): Promise<number> {
  const res = await fetch('/api/nepse-live');
  if (!res.ok) {
    throw new Error('Failed to fetch NEPSE Index via server-side Gemini API');
  }
  const data = await res.json();
  if (!data || typeof data.index !== 'number') {
    throw new Error('Invalid NEPSE payload returned from Server API');
  }
  return data.index;
}
