# TensorTraffic: AI-Powered Civic Incident Reporting & Analysis Platform

TensorTraffic is a full-stack web application built with Next.js that allows users to report, view, and analyze civic incidents in real-time. It leverages the power of Generative AI to analyze incident reports, identify trends, provide predictive alerts, and offer a suite of tools for enhancing public safety and awareness.

The application uses **Firebase Firestore** as its backend for data storage, **Google Maps Platform** for all geospatial features, **Genkit (with Gemini)** for AI-powered analysis, **Perplexity AI** for real-time web searches, and **ElevenLabs** for automated voice calls.

## Key Features

### Core Incident Management
- **📸 AI-Powered Incident Reporting**: Users can upload an image or video of an incident (e.g., water logging, accident), provide a description, and select a location. A Genkit AI flow analyzes the media and text to automatically categorize the incident, assess its severity, and generate a detailed report.
- **🗺️ Interactive Incidents Map**: All reported incidents are displayed on an interactive map. Users can filter incidents by category and view details in a dialog.
- **🔥 Community-Sourced Data**: The platform includes community features like upvoting and commenting on incidents, helping to verify and add context to reports.
- **💾 Firestore Backend**: All incident data, comments, and upvotes are securely stored and retrieved from Firebase Firestore.

### Advanced AI & Data Analysis
- **📈 Analytics Dashboard**: A dedicated page visualizes incident data with charts showing breakdowns by category and day of the week.
- **✨ AI Trend Analysis**: An AI flow analyzes the entire incident dataset to identify hotspots, recurring problems, and other key trends, presenting them in a clear, narrative summary.
- **🧠 Predictive Alerts**: Users can see incidents within a radius of their current location. An AI flow analyzes these nearby incidents to predict immediate consequences, secondary effects (like traffic on alternate routes), and offer actionable safety advice.
- **🤖 Live Agent**: Users can search for any location to get real-time, AI-analyzed summaries of live events sourced from the web, including traffic disruptions and power outages.

### Route & Safety Features
- **🚗 Route Safety Alerts**: Before starting a journey, users can input a start and end point. The application fetches the route, identifies incidents along it, and uses an AI flow to generate a concise, voice-enabled summary of potential hazards.
- **🛡️ Parental Alerts**: A specialized version of the route alert system, designed for parents to check the route to their child's school. It includes an emergency feature to log a time-sensitive alert with authorities.

### User Experience
- **📍 Flexible Location Input**: Users can report incidents using their current GPS location or by manually selecting a point on a map, which includes a place search feature.
- **📱 Responsive Design**: The application is fully responsive and provides an optimized experience for both desktop and mobile users, including a mobile-friendly navigation menu.
- **⬇️ Data Export**: From the analytics page, users can download the complete list of incidents as a CSV file for offline analysis.

## Environment Setup (`.env` file)

To run this project locally, you need to create a `.env` file in the root directory and populate it with the necessary API keys and configuration variables.

```env
# Firebase Configuration (Client-side)
# Get these from your Firebase project settings in the console.
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# Google Maps API Key
# Must be enabled for: Maps JavaScript API, Places API, Directions API, Geocoding API, Air Quality API.
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Genkit / Google AI (Gemini) API Key
# Used for all AI analysis flows.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Perplexity AI API Key
# Used by the "Live Agent" feature for real-time web searches.
PERPLEXITY_API_KEY="YOUR_PERPLEXITY_AI_API_KEY"

# ElevenLabs API Keys (for AI Voice Agent Calls)
# Used by the "Report Incident" page to make automated emergency calls.
ELEVENLABS_API_KEY="YOUR_ELEVENLABS_API_KEY"
NEXT_PUBLIC_ELEVENLABS_AGENT_ID="YOUR_ELEVENLABS_AGENT_ID"
NEXT_PUBLIC_ELEVENLABS_AGENT_PHONE_NUMBER_ID="YOUR_ELEVENLABS_AGENT_PHONE_NUMBER_ID"
NEXT_PUBLIC_EMERGENCY_CONTACT_NUMBER="PHONE_NUMBER_TO_CALL_IN_EMERGENCY" # e.g., +15551234567

```

### Getting Your Keys

1.  **Firebase & Google Maps**: Create a project on the [Firebase Console](https://console.firebase.google.com/). Your Firebase config and Google Maps key will be available there. Ensure you enable all the required Google Maps APIs.
2.  **Gemini API Key**: Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  **Perplexity AI API Key**: Get your key from the [Perplexity Labs](https://www.perplexity.ai/settings/api) platform.
4.  **ElevenLabs**: Get your API key and set up a voice agent and phone number in the [ElevenLabs Dashboard](https://elevenlabs.io/).

## Running the Project

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.
