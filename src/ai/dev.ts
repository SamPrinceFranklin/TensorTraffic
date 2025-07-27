import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-incident-report.ts';
import '@/ai/flows/summarize-incidents-flow.ts';
import '@/ai/flows/predictive-analysis-flow.ts';
import '@/ai/flows/analyze-single-incident-impact-flow.ts';
import '@/ai/flows/generate-route-alert-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
import '@/ai/flows/initiate-agent-call-flow.ts';
import '@/ai/flows/analyze-live-incidents-flow.ts';
import '@/ai/flows/summarize-trends-flow.ts';
