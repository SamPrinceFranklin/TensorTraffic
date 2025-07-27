
'use server';

/**
 * @fileOverview A flow to analyze a list of incidents and identify trends.
 *
 * - summarizeTrends - A function that handles the trend analysis process.
 * - SummarizeTrendsInput - The input type for the summarizeTrends function.
 * - SummarizeTrendsOutput - The return type for the summarizeTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Incident } from '@/lib/types';

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
  upvotes: z.number().optional(),
});

const SummarizeTrendsInputSchema = z.object({
    incidents: z.array(IncidentSchema).describe('A list of all incidents to analyze for trends.'),
});
export type SummarizeTrendsInput = z.infer<typeof SummarizeTrendsInputSchema>;

const SummarizeTrendsOutputSchema = z.object({
  trendSummary: z.string().describe('A 2-3 sentence summary of the most important trends found in the data.'),
  keyObservations: z.array(z.string()).describe('A list of 3-5 bullet points highlighting key observations, such as incident hotspots, recurring issues, or changes over time.'),
});
export type SummarizeTrendsOutput = z.infer<typeof SummarizeTrendsOutputSchema>;

export async function summarizeTrends(input: SummarizeTrendsInput): Promise<SummarizeTrendsOutput> {
  return summarizeTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTrendsPrompt',
  input: { schema: SummarizeTrendsInputSchema },
  output: { schema: SummarizeTrendsOutputSchema },
  prompt: `You are a public safety data analyst. Your task is to analyze a dataset of incident reports and provide a high-level summary of trends and key observations. The dataset contains incidents with categories, severities, locations, and timestamps.

**Analysis Tasks:**

1.  **Identify Hotspots:** Look for concentrations of incidents. Are there specific addresses or areas where incidents frequently occur?
2.  **Analyze by Category:** What are the most common types of incidents? Are there any unusual patterns?
3.  **Analyze by Time:** Are there specific days of the week or times of day when incidents are more common? (Note: The timestamp is an ISO string).
4.  **Synthesize Findings:** Based on your analysis, generate a concise trend summary and a list of key observations.

**Example Output:**
-   **Trend Summary:** "Analysis of recent incident data reveals a significant concentration of road accidents along Main Street, particularly during evening rush hour. We've also noted a recurring pattern of electrical issues in the downtown district, suggesting a potential infrastructure problem."
-   **Key Observations:**
    *   "Over 50% of all reported accidents occurred on Main Street."
    *   "Water logging incidents are most common on weekends, likely due to stadium traffic."
    *   "The neighborhood of Oak Park has a high density of 'Fallen Tree' reports, indicating a need for city maintenance."

**Data to Analyze:**
Total Incidents: {{incidents.length}}

{{#each incidents}}
- Category: {{category}}
  - Severity: {{severity}}
  - Timestamp: {{timestamp}}
  {{#if address}}
  - Address: {{address}}
  {{/if}}
{{/each}}

Provide your analysis in the requested structured format. Do not include markdown formatting in your response.
`,
});

const summarizeTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeTrendsFlow',
    inputSchema: SummarizeTrendsInputSchema,
    outputSchema: SummarizeTrendsOutputSchema,
  },
  async (input) => {
    if (input.incidents.length < 5) {
        return {
            trendSummary: "Not enough data to perform a meaningful trend analysis. More incidents need to be reported to identify patterns.",
            keyObservations: ["At least 5 incidents are required for trend analysis."],
        }
    }
    const { output } = await prompt(input);
    return output!;
  }
);
