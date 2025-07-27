
'use server';

import { formatDistanceToNow } from 'date-fns';
import { analyzeLiveIncidents, AnalyzeLiveIncidentsOutput } from '@/ai/flows/analyze-live-incidents-flow';

export interface LiveIncident {
  id: string;
  source: 'Web' | 'Social Media' | 'Official';
  title: string;
  summary: string;
  url: string;
  timestamp: string; // ISO string
  timeAgo: string;
  location: string;
}

export interface AnalyzedIncidentReport {
    analysis: AnalyzeLiveIncidentsOutput;
    supportingIncidents: LiveIncident[];
}

interface PerplexitySearchResult {
    title: string;
    url: string;
    summary?: string;
}

async function performPerplexitySearch(apiKey: string, prompt: string): Promise<PerplexitySearchResult[]> {
    const url = "https://api.perplexity.ai/chat/completions";
    const payload = {
        model: "sonar",
        messages: [{ "role": "user", "content": prompt }],
    };
    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: headers
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.error("Perplexity API Error:", responseData);
        // Don't throw, just return empty so one search failing doesn't kill the whole feature
        return []; 
    }

    return responseData.search_results || [];
}


export async function getLiveIncidents(location: {
  lat: number;
  lng: number;
  address: string;
}): Promise<{ success: boolean; data?: AnalyzedIncidentReport[], error?: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'Perplexity API key is not configured. Please add PERPLEXITY_API_KEY to your .env file.' };
  }
  
  const trafficPrompt = `Find real-time and upcoming civic incidents for the location "${location.address}". Search only for the last 2 days. Focus exclusively on events that disrupt public commute and daily activities. Consolidate multiple reports of the same event into a single summary.

Include only the following types of events:
- Traffic alerts, accidents, and road changes
- Road closures (temporary or long-term)
- Public protests, demonstrations, or mass gatherings
- Visits by politicians or VIPs causing traffic regulation changes
- Natural calamities (e.g., water logging, flooding, tree fall)`;

  const electricityPrompt = `Find official announcements or news about power cuts, electrical maintenance schedules, or major electrical faults from the local electricity board or utility provider for the area of "${location.address}". Search only for the last 48 hours.`;


  try {
    const [trafficResults, electricityResults] = await Promise.all([
        performPerplexitySearch(apiKey, trafficPrompt),
        performPerplexitySearch(apiKey, electricityPrompt)
    ]);
    
    const allReports: AnalyzedIncidentReport[] = [];

    // Analyze Traffic Incidents
    const trafficIncidents: LiveIncident[] = trafficResults.map((item: PerplexitySearchResult, index: number) => ({
        id: `traffic-${index}-${new Date().getTime()}`,
        source: 'Web', title: item.title, summary: item.summary || 'Source: ' + new URL(item.url).hostname,
        url: item.url, timestamp: new Date().toISOString(), timeAgo: 'Just now', location: location.address,
    }));
    const trafficAnalysis = await analyzeLiveIncidents(trafficIncidents);
    allReports.push({ analysis: trafficAnalysis, supportingIncidents: trafficIncidents });

    // Analyze Electricity Incidents
    const electricityIncidents: LiveIncident[] = electricityResults.map((item: PerplexitySearchResult, index: number) => ({
        id: `elec-${index}-${new Date().getTime()}`,
        source: 'Web', title: item.title, summary: item.summary || 'Source: ' + new URL(item.url).hostname,
        url: item.url, timestamp: new Date().toISOString(), timeAgo: 'Just now', location: location.address,
    }));
    const electricityAnalysis = await analyzeLiveIncidents(electricityIncidents);
    allReports.push({ analysis: electricityAnalysis, supportingIncidents: electricityIncidents });

    return { success: true, data: allReports };

  } catch (error: any) {
    console.error("Error fetching live incidents:", error);
    return { success: false, error: error.message || "An unknown error occurred." };
  }
}
