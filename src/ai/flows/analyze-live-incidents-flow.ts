
'use server';

/**
 * @fileOverview A flow to analyze a list of live incidents from web searches.
 *
 * - analyzeLiveIncidents - A function that handles the live incident analysis process.
 * - AnalyzeLiveIncidentsInput - The input type for the analyzeLiveIncidents function.
 * - AnalyzeLiveIncidentsOutput - The return type for the analyzeLiveIncidents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LiveIncidentSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  timestamp: z.string(),
  timeAgo: z.string(),
  location: z.string(),
});

const AnalyzeLiveIncidentsInputSchema = z.array(LiveIncidentSchema);
export type AnalyzeLiveIncidentsInput = z.infer<typeof AnalyzeLiveIncidentsInputSchema>;

const AnalyzeLiveIncidentsOutputSchema = z.object({
    incidentCategory: z.string().describe("A concise category for the event (e.g., 'Protest', 'Road Closure', 'Public Event', 'Power Outage')."),
    analysisSummary: z.string().describe("A summary of the event and its potential impact on traffic, safety, or public access. Be specific. If a road is closed, mention the road's name. If there is a protest, mention the location."),
    impactLevel: z.enum(['High', 'Moderate', 'Low']).describe("The assessed impact level on daily activities and commute. 'High' for major disruptions, 'Moderate' for significant delays, 'Low' for minor issues or clear routes."),
});
export type AnalyzeLiveIncidentsOutput = z.infer<typeof AnalyzeLiveIncidentsOutputSchema>;


export async function analyzeLiveIncidents(input: AnalyzeLiveIncidentsInput): Promise<AnalyzeLiveIncidentsOutput> {
  return analyzeLiveIncidentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLiveIncidentsPrompt',
  input: { schema: AnalyzeLiveIncidentsInputSchema },
  output: { schema: AnalyzeLiveIncidentsOutputSchema },
  prompt: `You are a civic intelligence analyst. Your task is to analyze a list of search results about local events and determine the potential impact on the public.

  Review the following search result items:
  {{#each this}}
  - **Title:** {{title}}
    - **URL:** {{url}}
    - **Summary:** {{summary}}
  {{/each}}
  
  **Analysis Tasks:**

  1.  **Synthesize:** Read all the items and identify the core event or incident being reported.
  2.  **Categorize:** Assign a single, concise category to this event (e.g., "Protest", "Road Closure", "Infrastructure Work", "Public Event", "Power Outage").
  3.  **Summarize Impact:** Write a brief, one or two-sentence summary describing the event and its most likely impact on public commute and daily activities. Be very specific. Instead of "a road is closed", write "Main Street is closed between 1st and 3rd Avenue". Extract the specific names of locations, streets, or areas from the search results.
  4.  **Assess Impact Level:** Based on the summary, determine the overall impact level.
        - **High:** The event will cause major disruptions, road closures, or safety risks. Commute is heavily affected.
        - **Moderate:** The event will likely cause significant delays or detours.
        - **Low:** The event has a minor effect on commute or is just for general awareness.

  Provide the output in the requested structured format.
  `,
});

const analyzeLiveIncidentsFlow = ai.defineFlow(
  {
    name: 'analyzeLiveIncidentsFlow',
    inputSchema: AnalyzeLiveIncidentsInputSchema,
    outputSchema: AnalyzeLiveIncidentsOutputSchema,
  },
  async (input) => {
    // If there are no incidents, return a default "clear" state.
    if (input.length === 0) {
        return {
            incidentCategory: 'No Incidents',
            analysisSummary: 'No significant civic incidents or disruptions were found in the selected area for the last 48 hours.',
            impactLevel: 'Low',
        };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
