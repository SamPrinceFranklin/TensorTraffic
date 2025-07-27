
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bot, LoaderCircle, MapPin, Search, Link as LinkIcon, AlertTriangle, Wand2, BookText, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { getLiveIncidents, AnalyzedIncidentReport, LiveIncident } from '@/lib/live-incidents-service';
import { MapComponent } from '@/components/map';
import { Incident } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';


type LocationState = {
  lat: number;
  lng: number;
  address: string;
} | null;

const ImpactCard = ({ report, address }: { report: AnalyzedIncidentReport, address: string }) => {
    const impactStyles = {
        High: {
            icon: AlertTriangle,
            cardClass: 'border-destructive bg-red-50',
            textClass: 'text-destructive',
            badgeClass: 'bg-destructive hover:bg-destructive/80',
        },
        Moderate: {
            icon: ShieldAlert,
            cardClass: 'border-yellow-500 bg-yellow-50',
            textClass: 'text-yellow-600',
            badgeClass: 'bg-yellow-500 hover:bg-yellow-500/80',
        },
        Low: {
            icon: ShieldCheck,
            cardClass: 'border-green-500 bg-green-50',
            textClass: 'text-green-600',
            badgeClass: 'bg-green-500 hover:bg-green-500/80',
        }
    };

    const style = impactStyles[report.analysis.impactLevel] || impactStyles.Low;
    const Icon = style.icon;

    // Don't render a card if the analysis says no incidents were found.
    if (report.analysis.incidentCategory === 'No Incidents Found' || report.analysis.incidentCategory === 'No Incidents') {
        return null;
    }

    return (
       <Card className={`shadow-md hover:shadow-lg transition-shadow ${style.cardClass}`}>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <CardTitle className={`font-headline text-xl flex items-center gap-3 ${style.textClass}`}>
                        <Icon className="w-6 h-6" />
                        {report.analysis.incidentCategory}
                    </CardTitle>
                    <Badge className={style.badgeClass}>{report.analysis.impactLevel} Impact</Badge>
                </div>
                <CardDescription>
                    AI-generated analysis of live events in {address}.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-muted-foreground pb-4 border-b">
                    {report.analysis.analysisSummary}
                </p>
                {report.supportingIncidents.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <BookText className='w-4 h-4' />
                                <span>
                                    View {report.supportingIncidents.length} Supporting Source{report.supportingIncidents.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-3">
                            {report.supportingIncidents.map((incident) => (
                                <Card key={incident.id} className="bg-background/50">
                                    <CardHeader className="pb-2 pt-4">
                                        <CardTitle className="text-base flex items-center gap-3">
                                            {incident.title}
                                        </CardTitle>
                                        <CardDescription>{incident.timeAgo} &bull; {incident.location}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{incident.summary}</p>
                                        <Button variant="link" asChild className="p-0 h-auto mt-2 text-xs">
                                            <a href={incident.url} target="_blank" rel="noopener noreferrer">
                                                View Source <LinkIcon className="w-3 h-3 ml-1" />
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                )}
            </CardContent>
        </Card>
    );
};


export default function LiveAgentPage() {
  const [location, setLocation] = useState<LocationState>(null);
  const [analyzedReports, setAnalyzedReports] = useState<AnalyzedIncidentReport[]>([]);
  const [isFetchingIncidents, setIsFetchingIncidents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery) {
        toast({variant: 'destructive', title: 'Please enter a location to search.'});
        return;
    }
    if (!isMapLoaded || typeof google === 'undefined') {
        toast({variant: 'destructive', title: 'Map service is not available.'});
        return;
    }
    
    setIsFetchingIncidents(true);
    setAnalyzedReports([]);
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, async (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const newLocationData = results[0].geometry.location;
            const newLocation = {
                lat: newLocationData.lat(),
                lng: newLocationData.lng(),
                address: results[0].formatted_address
            };
            setLocation(newLocation);
            setSearchQuery(newLocation.address);
            
            const result = await getLiveIncidents(newLocation);
            if (result.success && result.data) {
                setAnalyzedReports(result.data);
                setApiKeyMissing(false);
            } else {
                if (result.error?.includes('API key')) {
                    setApiKeyMissing(true);
                }
                toast({ variant: 'destructive', title: 'Failed to fetch live incidents.', description: result.error });
            }
        } else {
            toast({variant: 'destructive', title: 'Could not find location.', description: `Geocoder failed due to: ${status}`});
        }
        setIsFetchingIncidents(false);
    });
  }
  
  const mapPins = useMemo(() => {
    if (!location) return [];
    return [{
        id: 'search-location',
        location: { latitude: location.lat, longitude: location.lng },
        category: 'Home',
        severity: 'Low',
        summary: location.address,
        timestamp: new Date().toISOString()
    }] as Incident[];
  }, [location]);

  const hasContentToShow = analyzedReports.some(
    report => report.analysis.incidentCategory !== 'No Incidents Found' && report.analysis.incidentCategory !== 'No Incidents'
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-3">
            <Bot className="w-12 h-12" /> Live Agent
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Enter a location to get real-time, AI-analyzed incident updates from across the web.
          </p>
        </header>

        <div className="max-w-4xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card>
                    <CardContent className='p-4'>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary" />
                             <Input
                                placeholder="Search for a city, address, or region..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                                disabled={!isMapLoaded}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                            />
                            <Button onClick={handleSearch} disabled={!isMapLoaded || isFetchingIncidents}>
                                <Search className="w-4 h-4"/>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                    {isFetchingIncidents ? (
                    <div className="flex justify-center items-center gap-2 text-muted-foreground text-lg py-16">
                        <LoaderCircle className="w-6 h-6 animate-spin" />
                        <p>{"Searching and analyzing incidents..."}</p>
                    </div>
                    ) : apiKeyMissing ? (
                         <Card className="border-destructive">
                            <CardHeader className='flex-row items-center gap-4 space-y-0'>
                                <AlertTriangle className="w-8 h-8 text-destructive" />
                                <div>
                                    <CardTitle>API Key Missing</CardTitle>
                                    <CardDescription>
                                        The Perplexity API key is not configured. Please add it to your .env file.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : analyzedReports.length > 0 && location ? (
                        hasContentToShow ? (
                            analyzedReports.map((report, index) => (
                                <ImpactCard key={index} report={report} address={location.address} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <p className="text-muted-foreground">No significant live incidents found for this area.</p>
                                </CardContent>
                            </Card>
                        )
                    ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">Enter a location and click search to begin.</p>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </div>
            <div className="h-[400px] md:h-[600px] rounded-lg overflow-hidden">
                <MapComponent
                    incidents={mapPins}
                    onPinClick={() => {}}
                    onMapLoad={setIsMapLoaded}
                    center={location ? { lat: location.lat, lng: location.lng } : { lat: 37.7749, lng: -122.4194 }}
                    zoom={location ? 11 : 9}
                />
            </div>
        </div>
      </main>
    </div>
  );
}
