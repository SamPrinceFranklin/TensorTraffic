'use server';

/**
 * @fileOverview A flow to analyze incident reports based on media and description.
 *
 * - analyzeIncidentReport - A function that handles the incident analysis process.
 * - AnalyzeIncidentReportInput - The input type for the analyzeIncidentReport function.
 * - AnalyzeIncidentReportOutput - The return type for the analyzeIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeIncidentReportInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A photo or video of the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the incident.'),
  location: z.object({
    latitude: z.number().describe('Latitude of the incident location.'),
    longitude: z.number().describe('Longitude of the incident location.'),
  }).describe('The location of the incident.'),
});
export type AnalyzeIncidentReportInput = z.infer<typeof AnalyzeIncidentReportInputSchema>;

const AnalyzeIncidentReportOutputSchema = z.object({
  incidentCategory: z.string().describe('The category of the incident.'),
  severity: z.enum(['Low', 'Medium', 'High']).describe('The severity of the incident.'),
  summaryReport: z.string().describe('A detailed summary report of the incident.'),
  callSummary: z.string().describe('A very short summary of the incident, maximum 10 words, for a voice call.'),
});
export type AnalyzeIncidentReportOutput = z.infer<typeof AnalyzeIncidentReportOutputSchema>;

export async function analyzeIncidentReport(input: AnalyzeIncidentReportInput): Promise<AnalyzeIncidentReportOutput> {
  return analyzeIncidentReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeIncidentReportPrompt',
  input: {schema: AnalyzeIncidentReportInputSchema},
  output: {schema: AnalyzeIncidentReportOutputSchema},
  prompt: `You are an AI assistant designed to analyze incident reports. Your task is to categorize the incident, determine its severity, and provide both a detailed summary and a very short summary for a voice call.

  **Incident Information:**
  - **Description:** {{{description}}}
  - **Location:** Latitude: {{{location.latitude}}}, Longitude: {{{location.longitude}}}
  - **Media:** {{media url=mediaDataUri}}

  **Analysis Tasks:**

  1.  **Categorize the Incident:** Classify the incident into one of the following categories:
      *   Road Accidents
      *   Fire Accidents
      *   Electrical Issues
      *   Water Logging
      *   Drainage/Fallen Tree
      *   Road Blockages
      *   Construction Zones
      *   Other

  2.  **Determine Severity:** Assess the severity of the incident as 'Low', 'Medium', or 'High' based on the visual evidence and description.

  3.  **Generate Detailed Summary:** Write a concise, factual summary of the incident. This will be shown in a report.

  4.  **Generate Call Summary:** Create a very short summary, 10 words maximum, suitable for a voice call to emergency services. Example: "Car accident with injuries on Main Street."

  Provide the output in the requested structured format.`,
});

const analyzeIncidentReportFlow = ai.defineFlow(
  {
    name: 'analyzeIncidentReportFlow',
    inputSchema: AnalyzeIncidentReportInputSchema,
    outputSchema: AnalyzeIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
