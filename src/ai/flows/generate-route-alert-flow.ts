'use server';

/**
 * @fileOverview A flow to analyze incidents along a route and generate a summary alert.
 *
 * - generateRouteAlert - A function that handles the route alert generation process.
 * - GenerateRouteAlertInput - The input type for the generateRouteAlert function.
 * - GenerateRouteAlertOutput - The return type for the generateRouteAlert function.
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

const GenerateRouteAlertInputSchema = z.object({
  incidents: z.array(IncidentSchema).describe('A list of incidents detected along the user\'s planned route.'),
  fromAddress: z.string().describe('The starting address of the route.'),
  toAddress: z.string().describe('The destination address of the route.'),
  nextIncidentDistance: z.string().optional().describe('The estimated travel distance to the very next incident on the route.'),
});
export type GenerateRouteAlertInput = z.infer<typeof GenerateRouteAlertInputSchema>;

const GenerateRouteAlertOutputSchema = z.object({
  alertSummary: z.string().describe('A very short, concise, and direct summary of the key incidents on the route to be used for a voice alert. Mention the most severe issues first.'),
  detailedAlerts: z.array(z.object({
      incidentId: z.string(),
      category: z.string(),
      severity: z.string(),
      summary: z.string(),
  })).describe('A list of the individual alerts for the UI.'),
});
export type GenerateRouteAlertOutput = z.infer<typeof GenerateRouteAlertOutputSchema>;

export async function generateRouteAlert(input: GenerateRouteAlertInput): Promise<GenerateRouteAlertOutput> {
  return generateRouteAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRouteAlertPrompt',
  input: { schema: GenerateRouteAlertInputSchema },
  output: { schema: GenerateRouteAlertOutputSchema },
  prompt: `You are a traffic alert system AI. Your task is to provide a very brief voice alert summary and a detailed list of incidents for a user's route from "{{fromAddress}}" to "{{toAddress}}".

Incidents on route:
{{#each incidents}}
- **ID:** {{id}}
- **Category:** {{category}}
- **Severity:** {{severity}}
- **Summary:** {{summary}}
{{/each}}

{{#if nextIncidentDistance}}
The next incident is about {{nextIncidentDistance}} away.
{{/if}}

**Tasks:**

1.  **Generate Voice Summary:** Create a single, short sentence summarizing the most critical issues on the route. This will be read aloud. Start with "Alert:" and be direct. If available, mention the distance to the next incident. For example: "Alert: There is an accident reported in about 2 miles, plus other incidents ahead." or "Alert: There is heavy traffic due to an accident on Main Street and reported water logging ahead." If there are no major issues, say "Alert: The route ahead is currently clear.".
2.  **Create Detailed List:** Create a list of all the incidents provided in the input for display in the UI.

Provide the output in the structured format requested.
`,
});

const generateRouteAlertFlow = ai.defineFlow(
  {
    name: 'generateRouteAlertFlow',
    inputSchema: GenerateRouteAlertInputSchema,
    outputSchema: GenerateRouteAlertOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
