import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export default function SEOHead({
  title,
  description = "Nepal's premier business and economic intelligence news portal featuring authoritative analyses, financial indices, and economic surveys.",
  imageUrl = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
}: SEOHeadProps) {
  const pageTitle = title
    ? `${title} | NepalEconomy.com`
    : "NepalEconomy.com – Nepal's Business & Economy News";

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set Document Title
    document.title = pageTitle;

    // Set Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Set Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title || "NepalEconomy.com");

    // Set Open Graph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    // Set Open Graph Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', imageUrl);

  }, [pageTitle, description, title, imageUrl]);

  return null;
}
