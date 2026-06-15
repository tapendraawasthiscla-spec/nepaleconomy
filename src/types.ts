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
}

export interface MarketMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  isUp: boolean;
  isLive?: boolean;
  isGemini?: boolean;
  lastUpdated?: string;
  lastUpdatedMs?: number;
}

export interface EconomicReport {
  id: string;
  title: string;
  date: string;
  size: string;
  downloads: number;
  author: string;
  pdfUrl: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}
