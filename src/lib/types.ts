export interface Incident {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  category: string;
  severity: string;
  summary: string;
  timestamp: string;
  address?: string;
  upvotes?: number;
}

export interface Comment {
    id: string;
    text: string;
    timestamp: string;
    // In a real app, this would be a user ID. For now, we'll use a generic value.
    author: string;
}
