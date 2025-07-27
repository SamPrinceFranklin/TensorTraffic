import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
    NEXT_PUBLIC_ELEVENLABS_AGENT_PHONE_NUMBER_ID: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID,
    NEXT_PUBLIC_EMERGENCY_CONTACT_NUMBER: process.env.EMERGENCY_CONTACT_NUMBER,
  }
};

export default nextConfig;
