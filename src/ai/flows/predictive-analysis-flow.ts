'use server';

/**
 * @fileOverview A flow to analyze nearby incidents and predict consequences.
 *
 * - predictiveAnalysis - A function that handles the predictive analysis process.
 * - PredictiveAnalysisInput - The input type for the predictiveAnalysis function.
 * - PredictiveAnalysisOutput - The return type for the predictiveAnalysis function.
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
});

const PredictiveAnalysisInputSchema = z.object({
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  incidents: z.array(IncidentSchema).describe('A list of incidents near the user.'),
});
export type PredictiveAnalysisInput = z.infer<typeof PredictiveAnalysisInputSchema>;

const PredictiveAnalysisOutputSchema = z.object({
  introduction: z.string().describe('A brief, one-sentence introduction to the situation.'),
  immediateConsequences: z.array(z.string()).describe('A list of the most direct and immediate impacts of the incidents.'),
  secondaryEffects: z.array(z.string()).describe('A list of likely knock-on effects, such as traffic on other roads.'),
  safetyAdvice: z.array(z.string()).describe('A list of clear, actionable safety recommendations for the user.'),
});
export type PredictiveAnalysisOutput = z.infer<typeof PredictiveAnalysisOutputSchema>;


export async function predictiveAnalysis(input: PredictiveAnalysisInput): Promise<PredictiveAnalysisOutput> {
  return predictiveAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveAnalysisPrompt',
  input: { schema: PredictiveAnalysisInputSchema },
  output: { schema: PredictiveAnalysisOutputSchema },
  prompt: `You are an expert traffic and public safety analyst. Your job is to predict the consequences of various incidents in a user's vicinity.

  **User's Current Location:**
  Latitude: {{{userLocation.latitude}}}, Longitude: {{{userLocation.longitude}}}

  **Nearby Incidents:**
  {{#each incidents}}
  - **Category:** {{category}}
    - **Severity:** {{severity}}
    - **Location:** Lat: {{location.latitude}}, Lng: {{location.longitude}}
    - **Summary:** {{summary}}
  {{/each}}
  
  **Analysis Task:**

  Based on the user's location and the list of nearby incidents, provide a predictive analysis. Your analysis should be concise, actionable, and broken down into the following parts. Do not include markdown formatting like asterisks.

  1.  **Introduction:** Provide a brief, one-sentence introduction summarizing the overall situation.
  2.  **Immediate Consequences:** Create a list of the direct impacts of these incidents. (e.g., "The accident on Main St. is causing a major roadblock.")
  3.  **Secondary Effects (Predictions):** Create a list of likely knock-on effects. Predict potential traffic jams on alternative routes, suggest areas to avoid, and identify any other hazards. (e.g., "Traffic from the Main St. accident is likely to spill over to Oak Ave, expect heavy congestion there for the next hour.", "Due to the water logging on 1st Ave, the nearby subway entrance might also be flooded.")
  4.  **Safety Advice:** Create a list of clear, simple safety advice. (e.g., "Avoid the downtown area if possible.", "If you must travel, allow for an extra 30 minutes and consider using public transport.")

  Provide the output in the structured format requested. Each point in the lists should be a complete sentence.`,
});

const predictiveAnalysisFlow = ai.defineFlow(
  {
    name: 'predictiveAnalysisFlow',
    inputSchema: PredictiveAnalysisInputSchema,
    outputSchema: PredictiveAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
