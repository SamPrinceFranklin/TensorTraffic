
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, ListFilter, Calendar } from 'lucide-react';
import { MapComponent } from '@/components/map';
import { getIncidents } from '@/lib/incidents-service';
import { Incident } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


const severityStyles = {
  Low: 'border-yellow-500/50 bg-yellow-50',
  Medium: 'border-orange-500/50 bg-orange-50',
  High: 'border-red-500/50 bg-red-50',
};

const severityBadgeStyles = {
    Low: 'bg-yellow-500 hover:bg-yellow-500/80',
    Medium: 'bg-orange-500 hover:bg-orange-500/80',
    High: 'bg-red-500 hover:bg-red-500/80',
}

export default function AccidentsNearYouPage() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [filteredAccidents, setFilteredAccidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string[]>(['Low', 'Medium', 'High']);
  const { toast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: 'destructive',
            title: 'Location Access Denied',
            description: 'Could not get your location. Please enable location permissions in your browser to see nearby accidents.',
          });
        }
      );
    }
  }, [toast]);
  
  useEffect(() => {
    const fetchIncidents = async () => {
      const result = await getIncidents();
      if (result.success && result.data) {
        setAllIncidents(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load incidents',
          description: result.error || 'Could not fetch incidents from the server.',
        });
      }
    };
    fetchIncidents();
  }, [toast]);

  useEffect(() => {
    if (location) {
      const accidents = allIncidents.filter(
        incident => 
          ['Accident', 'Road Accidents'].includes(incident.category) && 
          severityFilter.includes(incident.severity)
      );
      setFilteredAccidents(accidents);
    }
  }, [location, severityFilter, allIncidents]);

  const handleOpenMap = (incident: Incident) => {
    setSelectedIncident(incident);
  };
  
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Accidents Near You</h1>
          <p className="mt-4 text-lg text-muted-foreground">Stay informed about recent accidents in your vicinity.</p>
        </header>

        <div className="flex justify-center mb-8">
            <Card className='p-4'>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2'>
                        <ListFilter className="w-5 h-5" />
                        <span className="text-muted-foreground font-medium">Filter by Severity:</span>
                    </div>
                    <ToggleGroup 
                        type="multiple" 
                        variant="outline"
                        value={severityFilter} 
                        onValueChange={(value) => {
                            if (value) setSeverityFilter(value);
                        }}
                    >
                        <ToggleGroupItem value="Low">Low</ToggleGroupItem>
                        <ToggleGroupItem value="Medium">Medium</ToggleGroupItem>
                        <ToggleGroupItem value="High">High</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </Card>
        </div>

        {location ? (
          <div className="space-y-6">
            {filteredAccidents.length > 0 ? (
              filteredAccidents.map((incident) => (
                <Card key={incident.id} className={cn("shadow-md hover:shadow-lg transition-shadow border-2", severityStyles[incident.severity])}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="font-headline text-2xl flex items-center gap-3">
                         <AlertTriangle className="w-6 h-6 text-destructive" />
                         {incident.category}
                      </CardTitle>
                      <CardDescription>
                          <Badge className={cn(severityBadgeStyles[incident.severity])}>
                            Severity: {incident.severity}
                          </Badge>
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleOpenMap(incident)}>
                          <MapPin className="w-5 h-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl h-auto">
                        <DialogHeader>
                          <DialogTitle>Accident Location</DialogTitle>
                        </DialogHeader>
                        {selectedIncident && (
                           <div className="h-[400px] w-full mt-4">
                             <MapComponent
                                incidents={[selectedIncident]}
                                onPinClick={() => {}}
                                center={{ lat: selectedIncident.location.latitude, lng: selectedIncident.location.longitude }}
                                zoom={15}
                              />
                           </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{incident.summary}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                      <div className="flex items-center">
                         <MapPin className="w-4 h-4 mr-2" />
                         <span>{`Lat: ${incident.location.latitude.toFixed(5)}, Lng: ${incident.location.longitude.toFixed(5)}`}</span>
                      </div>
                       <div className="flex items-center">
                         <Calendar className="w-4 h-4 mr-2" />
                         <span>{format(new Date(incident.timestamp), 'PPpp')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No accidents reported for the selected severity levels.</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Detecting your location to find nearby accidents...</p>
          </div>
        )}
      </main>
    </div>
  );
}
