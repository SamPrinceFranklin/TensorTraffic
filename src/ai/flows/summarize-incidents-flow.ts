'use server';

/**
 * @fileOverview A flow to summarize a list of incidents.
 *
 * - summarizeIncidents - A function that handles the incident summarization process.
 * - SummarizeIncidentsInput - The input type for the summarizeIncidents function.
 * - SummarizeIncidentsOutput - The return type for the summarizeIncidents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IncidentSchema = z.object({
  id: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  category: z.string(),
  severity: z.string(),
  summary: z.string(),
  timestamp: z.string(),
  address: z.string().optional(),
});

const SummarizeIncidentsInputSchema = z.object({
  incidents: z.array(IncidentSchema).describe('A list of incidents to summarize.'),
  query: z.string().optional().describe('An optional user query to guide the summarization.'),
});
export type SummarizeIncidentsInput = z.infer<typeof SummarizeIncidentsInputSchema>;

const SummarizeIncidentsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided incidents.'),
});
export type SummarizeIncidentsOutput = z.infer<typeof SummarizeIncidentsOutputSchema>;

export async function summarizeIncidents(input: SummarizeIncidentsInput): Promise<SummarizeIncidentsOutput> {
  return summarizeIncidentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeIncidentsPrompt',
  input: { schema: SummarizeIncidentsInputSchema },
  output: { schema: SummarizeIncidentsOutputSchema },
  prompt: `You are an AI assistant designed to summarize incident data for a map view.
  
  Based on the following list of incidents, provide a short, high-level summary.
  
  {{#if query}}
  The user has provided the following question to guide the summary: "{{query}}".
  Please focus your summary on answering this question based on the provided incident data.
  {{else}}
  Your summary should start by mentioning the total number of incidents and then list the number of incidents for each category.
  When mentioning locations, ALWAYS prefer using the 'address' field if it is available. Only use latitude and longitude if no address is provided.
  Be concise and clear.
  
  Example: "There are 5 incidents in the visible area. This includes 3 road accidents, mainly around Main Street, and 2 cases of water logging near the downtown area."
  {{/if}}

  Incidents:
  {{#each incidents}}
  - Category: {{category}}
    {{#if address}}
    - Address: {{address}}
    {{else}}
    - Location: Lat: {{location.latitude}}, Lng: {{location.longitude}}
    {{/if}}
  {{/each}}
  `,
});

const summarizeIncidentsFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentsFlow',
    inputSchema: SummarizeIncidentsInputSchema,
    outputSchema: SummarizeIncidentsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
