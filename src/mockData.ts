import { Article, MarketMetric, EconomicReport } from './types';

export const INITIAL_METRICS: MarketMetric[] = [
  { id: '1', name: 'GDP Growth Rate', value: '4.2%', change: '+0.4%', isUp: true },
  { id: '2', name: 'NPR/USD Exchange', value: '133.40', change: '0.15', isUp: true },
  { id: '3', name: 'NEPSE Index', value: '2,847.12', change: '+12.45', isUp: true },
  { id: '4', name: 'NRB Policy Interest', value: '5.5%', change: '-0.5%', isUp: false },
  { id: '5', name: 'Remittance Inflow', value: '$9.4B', change: '+11.2%', isUp: true },
  { id: '6', name: 'CPI Inflation', value: '6.8%', change: '-0.3%', isUp: false },
  { id: '7', name: 'Foreign Reserves', value: '$14.5B', change: '+$0.3B', isUp: true }
];

export const INITIAL_REPORTS: EconomicReport[] = [
  {
    id: 'rep-1',
    title: 'Nepal Monetary Policy Review FY 2081/82',
    author: 'Nepal Rastra Bank (NRB)',
    date: 'May 12, 2026',
    size: '4.8 MB',
    downloads: 1420,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'rep-2',
    title: 'Hydropower Export Potential & Transmission Bottlenecks',
    author: 'Independent Energy Producers Association of Nepal (IPPAN)',
    date: 'April 09, 2026',
    size: '3.1 MB',
    downloads: 980,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  },
  {
    id: 'rep-3',
    title: 'Economic Survey 2080/81: National Performance Index',
    author: 'Ministry of Finance, Government of Nepal',
    date: 'June 01, 2026',
    size: '12.4 MB',
    downloads: 3240,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-hero',
    title: 'The Hydropower Renaissance: How Nepal is Transgressing Regional Energy Paradigms',
    excerpt: 'With over 3,000 MW connected to the national grid and long-term trilateral power trade agreements signed with India and Bangladesh, Nepal’s run-of-the-river potentials are transitioning into a multi-billion dollar export machine.',
    category: 'Economy',
    author: 'Ramesh Dahal',
    authorTitle: 'Chief Energy Policy Analyst',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    date: 'June 12, 2026',
    readTime: '7 min read',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    views: 4521,
    isHero: true,
    isFeatured: true,
    sources: ['Nepal Electricity Authority Annual Report', 'Ministry of Energy, Water Resources and Irrigation', 'CEDB Hydro Development Index'],
    content: `Nepal's domestic power sector is hitting an unprecedented inflection point, moving swiftly from a history of chronic load-shedding to becoming a key regional exporter. 

This transformation rests on robust hydrological architectures spanning key river systems like the Koshi, Gandaki, and Karnali. The Upper Tamakoshi (456 MW) and a flurry of secondary private sector developments have ballooned collective capacity to past 3,200 MW as of early 2026.

### The Subregional Trade Landscape
Under the historic bilateral agreement, India has committed to importing 10,000 MW of power from Nepal over the next decade. Meanwhile, the operationalization of the cross-border transmission lines (400 kV Dhalkebar-Muzaffarpur and upcoming pipelines) provides the technical scaffolding needed to route surplus wet-season power.

"What seemed like a hydro-dream in the early 2000s is now a hard-currency anchor," claims Ramesh Dahal. "Hydropower export revenue has the capacity to fundamentally correct our balance of payment deficit with India within six to eight fiscal cycles."

### Key Bottlenecks: Transmission & Dry Season Dynamics
However, significant structural hurdles remain. In the winter months, Nepal's river discharges drop substantially, reducing output to 30-40% of installed capacity. Consequently, Nepal still imports power during dry periods. Building reservoir-type projects (such as Budhigandaki or Dudhkoshi) is pressing to stabilize the annual supply. Additionally, domestic transmission constraints inside Nepal limit efficient grid-level integration.`
  },
  {
    id: 'art-f1',
    title: 'Monetary Moderation: NRB Targets 5.5% Policy Rate to Revitalize Credit Flow',
    excerpt: 'The central bank lowers requirements as inflation stabilizes, offering a cautious lifeline to credit-starved real estate and retail ventures.',
    category: 'Policy',
    author: 'Anita Bhattarai',
    authorTitle: 'Financial Sector Analyst',
    date: 'June 13, 2026',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    views: 3120,
    isFeatured: true,
    sources: ['Nepal Rastra Bank Monetary Directives', 'NEPSE Banking Indicators'],
    content: `Nepal Rastra Bank's recent rate readjustment signals a calculated transition towards macro revival. After multiple terms of restricted credit controls, the decision to moderate the policy corridor to 5.5% represents a long-awaited ease for capital-starved property and construction companies.

### Rebuilding Private Sector Credit Capacity
Over-compliance checks on commercial loan files are scheduled for calibration. By shifting capital requirements, NRB wants to steer available liquidity pools into high-wage areas rather than consumer lines of convenience.

"We are preparing the monetary environment to encourage private sector growth," reports Anita Bhattarai. "However, the commercial banks must enforce strict due-diligence parameters to ensure liquidity matches real productivity markers."`
  },
  {
    id: 'art-f2',
    title: 'Sovereign Rating and FDI: Navigating Nepal’s International Credit Profile',
    excerpt: 'Global credit agencies finalize sovereign rating index, a key step towards unlocking international bond issues and institutional venture investments.',
    category: 'Global',
    author: 'Dr. Sandeep Adhikari',
    authorTitle: 'Senior Economist, Former IMF Consultant',
    date: 'June 11, 2026',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
    views: 2901,
    isFeatured: true,
    sources: ['Fitch Ratings Emerging Market Brief', 'Nepal Investment Board Documents'],
    content: `The development of Nepal's first formal sovereign rating represents a historical milestone in the nation's financial evolution. International capital flows often stall due to the complete lack of verified sovereign pricing markers, keeping FDI limits extremely restricted.

### Establishing the Investment Infrastructure
Sensing this constraint, the Ministry has worked with global credit bureaus to compile baseline indices. Transparent ratings represent a highly critical pre-requisite before private software tech startups or hydropower projects can source low-rate global debt blocks.

"This is the infrastructure that bridges our domestic projects with global asset managers," says Dr. Sandeep Adhikari. "Without transparent sovereign ratings, our development will continue to face double-digit interest premiums."`
  },
  {
    id: 'art-f3',
    title: 'The Lalitpur Tech Hub: Inside Nepal’s High-Growth SaaS Exporters',
    excerpt: 'Local IT operations are silently servicing multi-million dollar global clients, creating thousands of high-wage jobs in the heart of Lalitpur.',
    category: 'Startups',
    author: 'Sushil Shrestha',
    authorTitle: 'Digital Economy Reporter',
    date: 'June 14, 2026',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
    views: 5902,
    isFeatured: true,
    sources: ['NASSCOM Nepal IT Register', 'Startup Nepal Annual Poll'],
    content: `While traditional trade portfolios show deficit trends, Nepal's virtual software exports are experiencing an incredible, silent expansion. Across residential enclaves in Jhamsikhel, Lalitpur, and Pulchowk, code cooperatives are servicing global software houses with high-performance services.

### Bypassing Geographic Constraints
IT services and SaaS engineering bypass standard subcontinental logistical blocks completely. High-speed fiber lines and a highly skilled, English-proficient workforce represent the active capital vectors driving high-wage career pathways for thousands of local developers.

"The government needs to ensure swift internet grids and fluid payment channels are legally protected," Shrestha explains. "SaaS exports represent a rapid, high-margin way to build hard currency reserves."`
  },
  {
    id: 'art-3',
    title: 'Tourism Resurgence: Trekking Trails and Luxury Resorts Report Peak Occupancies',
    excerpt: 'Arrivals cross 1.2 million with significant diversification into high-spending adventure tourism and luxury resorts across Pokhara and Chitwan.',
    category: 'Business',
    author: 'Prerana Karki',
    authorTitle: 'Hospitality Sector Correspondent',
    date: 'June 10, 2026',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    views: 1890,
    content: `Nepal's post-pandemic hospitality scene has experienced a profound shift from low-cost backpacker targetings to premium wellness and active adventure categories. 

High-end resort investments in Pokhara, Dhulikhel, and Bardia are reporting record-high Average Daily Rates (ADR), driven by luxury travelers from the GCC, Europe, and neighboring India. Government figures indicate that the average length of stay has crawled up to 13.5 days, while average daily spending crossed $52.00, marking a positive growth curve.`
  },
  {
    id: 'art-4',
    title: 'Remittance Pipelines: Capital Flows Beyond Consumptive Cycles',
    excerpt: 'Economists warn of over-reliance on outbound labor while structural policies seek to channel liquid capital into domestic infrastructure bonds.',
    category: 'Global',
    author: 'Dr. Sandeep Adhikari',
    authorTitle: 'Senior Economist',
    date: 'June 09, 2026',
    readTime: '8 min read',
    imageUrl: 'https://images.unsplash.com/photo-1542222024-c39e2281f121?w=600&auto=format&fit=crop&q=80',
    views: 4210,
    content: `Remittances from South Korea, Japan, the Middle East, and Europe continue to constitute over 23% of Nepal’s overall gross domestic product. While this keeps physical liquidity robust, over 80% is traditional consumptive expenditure. 

The Ministry of Finance in partnership with Nepal Rastra Bank is designing "Infrastructural Remittance Bonds" offering guaranteed 9.5% coupons in a desperate bid to channel these capital currents into domestic projects like Kathmandu-Terai Fast Track.`
  },
  {
    id: 'art-5',
    title: 'Agricultural Logistics: Redefining Cold Chains in the Terai Belt',
    excerpt: 'Agri-tech startups are mitigating high spoilage losses through IoT setups in cold warehouses, boosting smallholder farmer margins.',
    category: 'Business',
    author: 'Sushil Shrestha',
    authorTitle: 'Agritech & Business Reporter',
    date: 'June 08, 2026',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    views: 1530,
    content: `In the fertile Terai plains of Nepal, high post-harvest losses have historically undermined food security and farmer incomes. Over 30% of perishable vegetables decay before reaching city markets.

A dynamic crop of agritech logistics startups is deploying cellular monitoring sensors across newly established cold transit hubs. This network enables regional cooperatives to hedge sales, ensuring stable prices.`
  },
  {
    id: 'art-6',
    title: 'The Budget Dilemma: Narrowing Revenue Streams Amidst High Recurrent Cost',
    excerpt: 'State revenues face continuous tariff collection drops as domestic manufacturing shrinks, sparking calls for deep tax compliance audits.',
    category: 'Policy',
    author: 'Anita Bhattarai',
    authorTitle: 'Public Finance Expert',
    date: 'June 07, 2026',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    views: 2650,
    content: `Nepal's budgetary projections for the current Fiscal Year present a stark structural reality: recurrent expenditure, largely made of public administration salaries and pensions, is threatening to consume nearly the entire domestic tax revenue base.

This leaves Nepal chronically dependent on foreign grants, loans, and domestic treasury bills to finance its capital capital expenditure budgets.`
  }
];

export const INITIAL_RECOMMENDED_SECTORS = [
  { id: '1', name: 'Banking & Finance', stat: '20 commercial banks reporting capital stability indexes.', trend: '+4.5% Net Profit' },
  { id: '2', name: 'Tourism & Travel', stat: '1.2M annual tourists; Pokhara International airport expands.', trend: '+14% Arrivals' },
  { id: '3', name: 'Hydropower & Grid', stat: '3,200+ MW capacity; exports to India hit peak seasonal highs.', trend: '$240M Export Rev' },
  { id: '4', name: 'Agriculture & Food', stat: 'Terai region launches cold-storage microgrids.', trend: '+3.1% Output' },
  { id: '5', name: 'IT Services & SaaS', stat: 'Over 150 software exporters based in Kathmandu & Lalitpur.', trend: '+28% Yr/Yr Growth' },
  { id: '6', name: 'Remittance & Flows', stat: 'Bonds launched to channel flows into infrastructure.', trend: '$9.4B Inflow' }
];

// LocalStorage helpers to allow persistent updates
export function getStoredArticles(): Article[] {
  try {
    const data = localStorage.getItem('ne_articles');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error fetching stored articles', e);
  }
  return INITIAL_ARTICLES;
}

export function saveArticles(articles: Article[]): void {
  try {
    localStorage.setItem('ne_articles', JSON.stringify(articles));
  } catch (e) {
    console.error('Error saving articles', e);
  }
}

export function getStoredMetrics(): MarketMetric[] {
  try {
    const data = localStorage.getItem('ne_metrics');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error fetching stored metrics', e);
  }
  return INITIAL_METRICS;
}

export function saveMetrics(metrics: MarketMetric[]): void {
  try {
    localStorage.setItem('ne_metrics', JSON.stringify(metrics));
  } catch (e) {
    console.error('Error saving metrics', e);
  }
}

export function getStoredReports(): EconomicReport[] {
  try {
    const data = localStorage.getItem('ne_reports');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error fetching stored reports', e);
  }
  return INITIAL_REPORTS;
}

export function saveReports(reports: EconomicReport[]): void {
  try {
    localStorage.setItem('ne_reports', JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving reports', e);
  }
}
