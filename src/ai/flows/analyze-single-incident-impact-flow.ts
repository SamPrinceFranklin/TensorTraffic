'use server';

/**
 * @fileOverview A flow to analyze the potential impact of a single incident.
 *
 * - analyzeSingleIncidentImpact - A function that handles the single incident analysis process.
 * - AnalyzeSingleIncidentImpactInput - The input type for the analyzeSingleIncidentImpact function.
 * - AnalyzeSingleIncidentImpactOutput - The return type for the analyzeSingleIncidentImpact function.
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
});

const AnalyzeSingleIncidentImpactInputSchema = z.object({
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).describe("The user's current location."),
  incident: IncidentSchema.describe('The specific incident to analyze.'),
});
export type AnalyzeSingleIncidentImpactInput = z.infer<typeof AnalyzeSingleIncidentImpactInputSchema>;

const AnalyzeSingleIncidentImpactOutputSchema = z.object({
  impactAnalysis: z.string().describe('A detailed analysis of the incident\'s potential impact on nearby roads, traffic, and safety.'),
});
export type AnalyzeSingleIncidentImpactOutput = z.infer<typeof AnalyzeSingleIncidentImpactOutputSchema>;

export async function analyzeSingleIncidentImpact(input: AnalyzeSingleIncidentImpactInput): Promise<AnalyzeSingleIncidentImpactOutput> {
  return analyzeSingleIncidentImpactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSingleIncidentImpactPrompt',
  input: { schema: AnalyzeSingleIncidentImpactInputSchema },
  output: { schema: AnalyzeSingleIncidentImpactOutputSchema },
  prompt: `You are a hyperlocal traffic and safety AI assistant. Your task is to provide a detailed impact analysis for a single, specific incident based on its type, severity, and location relative to the user.

  **User's Current Location:**
  Latitude: {{{userLocation.latitude}}}, Longitude: {{{userLocation.longitude}}}

  **Incident to Analyze:**
  - **Category:** {{incident.category}}
  - **Severity:** {{incident.severity}}
  - **Location:** Lat: {{incident.location.latitude}}, Lng: {{incident.location.longitude}}
  - **Summary:** {{incident.summary}}
  - **Time Reported:** {{incident.timestamp}}

  **Analysis Task:**

  Based *only* on the single incident provided, generate a concise impact analysis. Be specific and actionable. Address the following points:

  1.  **Direct Road Impact:** What is the most likely immediate effect on the road where the incident occurred? (e.g., "This accident will likely cause a full or partial blockage of the road it's on.")
  2.  **Nearby Street Effects:** How will this impact adjacent streets? Predict which nearby roads might see increased congestion as drivers try to find alternative routes.
  3.  **Type-Specific Hazards:** What specific dangers are associated with this type of incident?
      *   For 'Water Logging', mention risks of vehicle damage, stalled cars, or impassable roads.
      *   For 'Accidents', mention the presence of emergency vehicles and debris.
      *   For 'Electrical Issues', warn about potential traffic light outages at nearby intersections.
      *   For 'Fallen Tree', mention road blockage and potential for residual debris.
  4.  **Actionable Advice:** Give a clear, simple recommendation. (e.g., "Avoid this immediate area. Use parallel routes two blocks to the north or south to bypass the congestion.")

  Your analysis should be direct and to the point. Do not give generic advice. Base your predictions on the incident's category and severity. A 'High' severity incident implies a much greater impact than a 'Low' one.
  `,
});

const analyzeSingleIncidentImpactFlow = ai.defineFlow(
  {
    name: 'analyzeSingleIncidentImpactFlow',
    inputSchema: AnalyzeSingleIncidentImpactInputSchema,
    outputSchema: AnalyzeSingleIncidentImpactOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
