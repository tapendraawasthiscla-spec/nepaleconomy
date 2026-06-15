import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  type?: 'article' | 'website';
}

export default function SEOHead({
  title,
  description = "Nepal's premier business and economic intelligence news portal featuring authoritative analyses, financial indices, and economic surveys.",
  imageUrl = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
  url = "https://nepaleconomy.com",
  type = "website"
}: SEOHeadProps) {
  // Title structure: "[ARTICLE TITLE] | NepalEconomy.com" for articles, "NepalEconomy.com – Nepal's Business & Economy News" for home
  const pageTitle = type === 'article' && title
    ? `${title} | NepalEconomy.com`
    : "NepalEconomy.com – Nepal's Business & Economy News";

  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : url;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || "NepalEconomy.com"} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || "NepalEconomy.com"} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Canonical Link */}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
