import { Article, ArticleCategory } from '../types';
import { saveArticles } from '../mockData';

// Pool of 20 compelling Nepal economy article title templates
const ARTICLE_TITLE_TEMPLATES = [
  "Nepal's Hydropower Export Revenue Reaches New Milestone in [MONTH] [YEAR]",
  "NRB Issues New Monetary Policy Directive on Commercial Bank Lending",
  "Foreign Direct Investment in Nepal's IT Sector Grows [X]% in Q[N]",
  "Remittance Inflows Hit [X] Billion in Latest Quarter Amid Gulf Migration",
  "Nepal Tourism Numbers Recover to Pre-Pandemic Levels in [SEASON]",
  "NEPSE Reacts to Global Market Movements: What Investors Need to Know",
  "Nepal-India Power Trade Agreement: Progress and Bottlenecks in [MONTH]",
  "Kathmandu Startup Ecosystem Attracts First Major Series B Funding",
  "NRN Diaspora Bond Program Opens for Applications: Key Details",
  "Nepal's Agricultural Export Deficit Widens as Import Costs Rise",
  "Budget Deficit Analysis: Nepal's FY 2081-82 Revenue Shortfall",
  "Pokhara International Airport Performance Update: Flights and Revenue",
  "Nepal's Inflation Rate and Consumer Spending Trends for [MONTH]",
  "Sovereign Credit Rating Update: What Agencies Say About Nepal 2026",
  "Hydropower Dry Season Impact: Nepal Still Imports Power in Winter",
  "Nepal Stock Market Weekly Outlook and Top Performing Sectors",
  "SME Lending Gap in Nepal: Banks vs Micro-Finance Institution Rates",
  "Nepal-China Trade Corridor Update: Rasuwagadhi Dry Port Activity",
  "Ministry of Finance Releases Economic Survey: Key Highlights",
  "Digital Banking Penetration in Nepal: Mobile Wallets and Fintech Growth"
];

// Aesthetic illustration pool
const IMAGE_RESOURCES = [
  "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80"
];

/**
 * Invokes Gemini via raw direct HTTP endpoint keeping payload requests robust in browser context.
 */
async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API responded with status ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No textual response returned from Gemini API.");
  }
  return text.trim();
}

/**
 * Checks elapsed time and triggers autonomous editorial generation on Nepal's economic topics.
 */
export async function checkAndAutoPublish(articles: Article[], setArticles: Function): Promise<void> {
  try {
    // 1. Check timestamp
    const lastPublishStr = localStorage.getItem('ne_last_auto_publish');
    const eighteenHoursMs = 18 * 60 * 60 * 1000;
    const now = new Date();

    if (lastPublishStr) {
      const lastPublishTime = new Date(lastPublishStr).getTime();
      if (now.getTime() - lastPublishTime < eighteenHoursMs) {
        console.log("[Auto-Publisher] Cooldown check approved; less than 18 hours since last release.");
        return;
      }
    }

    // Check API Key
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Auto-Publisher] Skipped auto-publishing: VITE_GEMINI_API_KEY is undefined.");
      return;
    }

    // 2. Select title template
    const dayIndex = now.getDay() % 20;
    let selectedTitle = ARTICLE_TITLE_TEMPLATES[dayIndex];

    // Format placeholders
    const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthsList[now.getMonth()];
    const currentYear = now.getFullYear().toString();

    selectedTitle = selectedTitle
      .replace(/\[MONTH\]/g, currentMonth)
      .replace(/\[YEAR\]/g, currentYear)
      .replace(/\[X\]/g, (10 + (now.getDate() % 8) + Math.random() * 0.9).toFixed(1))
      .replace(/\[N\]/g, ((now.getDate() % 4) + 1).toString())
      .replace(/\[SEASON\]/g, now.getMonth() >= 2 && now.getMonth() <= 4 ? "Spring" : now.getMonth() >= 8 && now.getMonth() <= 10 ? "Autumn" : "Dry Season");

    console.log(`[Auto-Publisher] Starting daily story publication: "${selectedTitle}"`);

    // 3. Collect full article content
    const todayDateFormatted = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const contentPrompt = `You are a senior Nepal economic journalist for NepalEconomy.com. Write a 450-500 word professional analytical article with this title: '${selectedTitle}'. Rules: Start directly with the article body paragraph. Use ### for 2 section headers. Include specific Nepal-relevant statistics and institutions. Use today's date ${todayDateFormatted}. Mention at least one institution from: NRB, NEA, MoF, NEPSE, NPC, World Bank Nepal. Do not add a byline or author name.`;
    
    const contentText = await generateWithGemini(apiKey, contentPrompt);

    // 4. Collect standard excerpt
    const excerptPrompt = `Write a 25-word compelling excerpt for this Nepal article title: '${selectedTitle}'. Return only the excerpt.`;
    const excerptText = await generateWithGemini(apiKey, excerptPrompt);

    // 5. Category classification logic
    let categoryDetected: ArticleCategory = 'Economy';
    const lowercaseTitle = selectedTitle.toLowerCase();
    
    if (
      lowercaseTitle.includes("nrb") ||
      lowercaseTitle.includes("monetary") ||
      lowercaseTitle.includes("interest rate") ||
      lowercaseTitle.includes("budget") ||
      lowercaseTitle.includes("deficit")
    ) {
      categoryDetected = 'Policy';
    } else if (
      lowercaseTitle.includes("nepse") ||
      lowercaseTitle.includes("stock") ||
      lowercaseTitle.includes("bank") ||
      lowercaseTitle.includes("fdi") ||
      lowercaseTitle.includes("investment")
    ) {
      categoryDetected = 'Business';
    } else if (
      lowercaseTitle.includes("tourism") ||
      lowercaseTitle.includes("startup") ||
      lowercaseTitle.includes("it") ||
      lowercaseTitle.includes("fintech")
    ) {
      categoryDetected = 'Startups';
    } else if (
      lowercaseTitle.includes("trade") ||
      lowercaseTitle.includes("nrn") ||
      lowercaseTitle.includes("diaspora") ||
      lowercaseTitle.includes("export")
    ) {
      categoryDetected = 'Global';
    }

    // 6. Assemble complete Article entity
    const randomImage = IMAGE_RESOURCES[now.getDate() % IMAGE_RESOURCES.length];
    const newArticle: Article = {
      id: `art-auto-${now.getTime()}`,
      title: selectedTitle,
      excerpt: excerptText.replace(/^"|"$/g, ''), // Strip speech marks if returned
      content: contentText,
      category: categoryDetected,
      author: localStorage.getItem('ne_admin_author_name') || "NepalEconomy Editorial Desk",
      authorTitle: localStorage.getItem('ne_admin_author_title') || "Assistant Economic Intelligence Analyst",
      authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      date: todayDateFormatted,
      readTime: "5 min read",
      imageUrl: randomImage,
      views: Math.floor(Math.random() * 80) + 30,
      sources: ["Nepal Central Bank Directives", "Ministry of Finance Surveys", "Economic Intelligence Bureau"],
      isHero: false,
      isFeatured: false
    };

    // Update runtime array, persist to browser state, update triggers
    const updatedCollection = [newArticle, ...articles];
    saveArticles(updatedCollection);
    setArticles(updatedCollection);
    
    localStorage.setItem('ne_last_auto_publish', now.toISOString());
    console.log("[Auto-Publisher] Daily article successfully scheduled, generated, and injected into the portal feed.");

  } catch (error) {
    console.warn("[Auto-Publisher] Background auto-publisher issue encountered:", error);
  }
}
