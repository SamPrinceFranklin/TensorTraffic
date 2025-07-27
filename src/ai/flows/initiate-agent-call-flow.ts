'use server';

/**
 * @fileOverview A flow to initiate an agentic call via ElevenLabs.
 *
 * - initiateAgentCall - A function that handles making the outbound call.
 * - InitiateAgentCallInput - The input type for the initiateAgentCall function.
 * - InitiateAgentCallOutput - The return type for the initiateAgentCall function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InitiateAgentCallInputSchema = z.object({
  agentId: z.string().describe('The ID of the ElevenLabs agent to use.'),
  agentPhoneNumberId: z.string().describe('The ID of the agent\'s Twilio phone number.'),
  toNumber: z.string().describe('The phone number to call.'),
  incidentSummary: z.string().describe('A summary of the incident for context.'),
});
export type InitiateAgentCallInput = z.infer<typeof InitiateAgentCallInputSchema>;

const InitiateAgentCallOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  conversation_id: z.string().optional(),
  callSid: z.string().optional(),
});
export type InitiateAgentCallOutput = z.infer<typeof InitiateAgentCallOutputSchema>;

export async function initiateAgentCall(input: InitiateAgentCallInput): Promise<InitiateAgentCallOutput> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ElevenLabs API key is not configured in environment variables.');
  }

  const url = 'https://api.elevenlabs.io/v1/convai/twilio/outbound-call';

  const headers = {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    agent_id: input.agentId,
    agent_phone_number_id: input.agentPhoneNumberId,
    to_number: input.toNumber,
    conversation_initiation_client_data: {
      type: "conversation_initiation_client_data",
      dynamic_variables: {
          incidentSummary: input.incidentSummary
      }
    }
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    const responseData = await response.json();

    if (!response.ok) {
        return {
            success: false,
            message: `API Error: ${responseData.detail?.msg || responseData.detail || response.statusText}`,
        };
    }
    
    // The API returns a 'call_details' object on success, which contains the callSid.
    // Let's check for that structure.
    return {
      success: responseData.success ?? true,
      message: responseData.message ?? 'Call initiated successfully.',
      conversation_id: responseData.conversation_id,
      callSid: responseData.call_details?.callSid,
    };

  } catch (error: any) {
    console.error('Error initiating agent call:', error);
    return {
      success: false,
      message: error.message || 'An unknown error occurred.',
    };
  }
}
