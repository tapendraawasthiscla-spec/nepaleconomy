export type ArticleCategory = 'Economy' | 'Business' | 'Policy' | 'Startups' | 'Global';

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: ArticleCategory;
  author: string;
  authorTitle?: string;
  authorImage?: string;
  date: string;
  readTime: string;
  imageUrl: string;
  views: number;
  sources?: string[];
  isFeatured?: boolean;
  isHero?: boolean;
  isBreaking?: boolean;
  breakingLabel?: string;
  
  // Nexus Upgraded Fields
  thumbnailUrl?: string;
  tags?: string[];
  status: 'published' | 'draft' | 'scheduled';
  scheduledDate?: string;
  featuredPosition?: number | null; // 1 = hero, 2-4 = secondary, null = normal feed
  slug: string;
  metaDescription?: string;
  coverCaption?: string;
  estimatedReadTime?: number;
}

export type ResourceCategory = 'income-tax' | 'vat' | 'excise' | 'customs' | 'other-laws' | 'general';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadedAt: string;
  
  // Nexus Upgraded Fields
  thumbnailUrl?: string;
  category?: ResourceCategory;
  shortCode?: string;
  viewCount?: number;
}

export interface EconomicReport {
  id: string;
  title: string;
  date: string;
  size: string;
  downloads?: number;
  author?: string;
  pdfUrl?: string; // fallback mock URL
  fileUrl: string; // actual uploaded link 
  description?: string;
  
  // Nexus Upgraded Fields
  category?: 'Monetary Policy' | 'Trade & Exports' | 'Hydropower & Energy' | 'Banking & Finance' | 'Taxation' | 'Startups & Tech';
  featured?: boolean;
  coverUrl?: string;
  isFeatured?: boolean;
  downloadCount?: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read?: boolean; // Nexus: inbox management
}

export interface CarouselSlide {
  id: string;
  imageUrl: string;
  isPdf?: boolean;
  caption?: string;
  linkedArticleId?: string;
  order?: number;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface ShortLink {
  code: string;
  targetUrl: string;
  hitCount: number;
  createdAt: string;
}

export type PdfReport = EconomicReport;
export type NewsTip = ContactMessage;

export interface MarketMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  trend?: 'up' | 'down';
  isUp: boolean;
  isLive?: boolean;
  sparkline?: number[];
  category?: string;
}

export type Report = EconomicReport;
