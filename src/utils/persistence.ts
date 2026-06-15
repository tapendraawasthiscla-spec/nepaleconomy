import { Article, MarketMetric, EconomicReport } from '../types';
import { getStoredArticles, getStoredMetrics, getStoredReports, saveArticles, saveMetrics, saveReports } from '../mockData';

export interface AppDatabase {
  articles: Article[];
  reports: EconomicReport[];
  metrics: MarketMetric[];
  lastSaved: string;
}

/**
 * Serializes the database as JSON, uploads it as a file to the Gemini Files API
 * using a multipart POST request with the API key, and stores the returned file URI
 * in localStorage under ne_cloud_file_uri.
 */
export async function pushDatabaseToCloud(data: AppDatabase): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing (VITE_GEMINI_API_KEY). Cannot upload to cloud.");
  }

  const boundary = "nepaleconomy_db_boundary_" + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({
    file: {
      displayName: "nepaleconomy_db.json"
    }
  });
  const fileContent = JSON.stringify(data);

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    fileContent,
    `--${boundary}--`
  ].join('\r\n');

  const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'multipart',
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload database: ${response.status} ${response.statusText} - ${errText}`);
  }

  const result = await response.json();
  const fileUri = result.file?.uri;
  if (!fileUri) {
    throw new Error("Upload completed, but no file URI was returned from the Gemini Files API.");
  }

  localStorage.setItem('ne_cloud_file_uri', fileUri);
  localStorage.setItem('ne_db_last_saved', data.lastSaved);
  return fileUri;
}

/**
 * Reads the cloud URI from localStorage, fetches the file bytes from Gemini Files API,
 * parses the JSON content, and returns the AppDatabase.
 */
export async function pullDatabaseFromCloud(): Promise<AppDatabase | null> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing. Cannot pull database from cloud.");
    return null;
  }

  const uri = localStorage.getItem('ne_cloud_file_uri');
  if (!uri) {
    console.log("No cloud file URI found in localStorage (ne_cloud_file_uri is empty).");
    return null;
  }

  // Extract the name part "files/xxxx" from the URI
  const match = uri.match(/files\/[a-zA-Z0-9_-]+/);
  if (!match) {
    console.warn(`Invalid cloud file URI format: ${uri}`);
    return null;
  }
  const fileName = match[0]; // e.g., "files/abc123xyz"

  const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}:download?alt=media&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Failed to download database from Gemini API: ${response.status} ${response.statusText}`);
    return null;
  }

  try {
    const data = await response.json();
    return data as AppDatabase;
  } catch (err) {
    console.error("Failed to parse database download as JSON:", err);
    return null;
  }
}

/**
 * Initializes the database by trying to pull from cloud.
 * If cloud pull returns valid data, it is used and saved to localStorage.
 * Otherwise, falls back to existing localStorage data.
 */
export async function initDatabase(): Promise<AppDatabase> {
  try {
    const cloudData = await pullDatabaseFromCloud();
    if (cloudData && cloudData.articles && cloudData.articles.length > 0) {
      console.log("Loaded database from Gemini Files API:", cloudData);
      
      // Update local storage content to stay synchronized
      saveArticles(cloudData.articles);
      if (cloudData.metrics) saveMetrics(cloudData.metrics);
      if (cloudData.reports) saveReports(cloudData.reports);
      if (cloudData.lastSaved) localStorage.setItem('ne_db_last_saved', cloudData.lastSaved);
      
      return cloudData;
    }
  } catch (err) {
    console.warn("Could not pull database from cloud, falling back to local storage:", err);
  }

  // Local storage fallback
  const articles = getStoredArticles();
  const metrics = getStoredMetrics();
  const reports = getStoredReports();
  const lastSaved = localStorage.getItem('ne_db_last_saved') || new Date().toISOString();

  return {
    articles,
    metrics,
    reports,
    lastSaved
  };
}
