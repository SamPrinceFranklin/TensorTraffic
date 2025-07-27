// This file is no longer used for displaying incidents on the map.
// Incidents are now fetched from Firestore via src/lib/incidents-service.ts
// This data is kept as a local backup or for testing purposes.

export interface MockIncident {
  id: number;
  lat: number;
  lng: number;
  category: 'Water Logging' | 'Accident' | 'PowerCut';
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  timestamp: Date;
}

export const incidents: MockIncident[] = [
  { id: 1, lat: 37.78, lng: -122.42, category: 'Water Logging', severity: 'Medium', description: 'Major intersection flooded, causing traffic delays.', timestamp: new Date('2024-07-20T10:30:00Z') },
  { id: 2, lat: 37.77, lng: -122.41, category: 'Accident', severity: 'High', description: 'Two-car collision with injuries reported. Emergency services on scene.', timestamp: new Date('2024-07-21T14:00:00Z') },
  { id: 3, lat: 37.76, lng: -122.43, category: 'Water Logging', severity: 'Low', description: 'Minor flooding on a residential street.', timestamp: new Date('2024-07-21T09:15:00Z') },
  { id: 4, lat: 37.79, lng: -122.4, category: 'PowerCut', severity: 'High', description: 'Widespread power outage affecting several blocks.', timestamp: new Date('2024-07-21T18:45:00Z') },
  { id: 5, lat: 37.75, lng: -122.45, category: 'Water Logging', severity: 'High', description: 'Underpass completely submerged. Road closed.', timestamp: new Date('2024-07-20T11:00:00Z') },
  { id: 6, lat: 37.8, lng: -122.44, category: 'Accident', severity: 'Medium', description: 'Minor fender-bender, no injuries reported but causing traffic slowdown.', timestamp: new Date('2024-07-21T16:20:00Z') },
  { id: 7, lat: 37.785, lng: -122.405, category: 'PowerCut', severity: 'Medium', description: 'Power flickering in the downtown area. Crews are investigating.', timestamp: new Date('2024-07-21T20:05:00Z') },
  { id: 8, lat: 37.765, lng: -122.415, category: 'Accident', severity: 'Low', description: 'A cyclist and a pedestrian collided. Minor injuries.', timestamp: new Date('2024-07-21T13:10:00Z') },
];
