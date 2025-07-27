
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { MapComponent } from '@/components/map';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Droplets, Car, PowerOff, Sparkles, LoaderCircle, MapPin, Calendar, AlertTriangle, TrafficCone as TrafficIcon, Wind, Flame, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { summarizeIncidents } from '@/ai/flows/summarize-incidents-flow';
import { getIncidents, upvoteIncident, addComment, getComments } from '@/lib/incidents-service';
import { Incident, Comment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';

export default function MapPage() {
  const [showWaterLogging, setShowWaterLogging] = useState(true);
  const [showAccidents, setShowAccidents] = useState(true);
  const [showPowerCuts, setShowPowerCuts] = useState(true);
  const [showOther, setShowOther] = useState(true);

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);


  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryQuery, setSummaryQuery] = useState('');
  const { toast } = useToast();
  
  const [showTraffic, setShowTraffic] = useState(false);
  const [showAqi, setShowAqi] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);

  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: 'destructive',
            title: 'Location Access Denied',
            description: 'Could not get your location. Defaulting to a central view.',
          });
          // Fallback to a default center if permission is denied
          setMapCenter({ lat: 37.7749, lng: -122.4194 }); 
          setIsLocating(false);
        }
      );
    } else {
        toast({
            variant: 'destructive',
            title: 'Geolocation Not Supported',
            description: 'Your browser does not support geolocation.',
        });
        setMapCenter({ lat: 37.7749, lng: -122.4194 }); 
        setIsLocating(false);
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
    const incidents = allIncidents.filter(incident => {
      if (showWaterLogging && incident.category === 'Water Logging') return true;
      if (showAccidents && ['Road Accidents', 'Accident'].includes(incident.category)) return true;
      if (showPowerCuts && ['Electrical Issues', 'PowerCut'].includes(incident.category)) return true;
      if (showOther && !['Water Logging', 'Road Accidents', 'Accident', 'Electrical Issues', 'PowerCut'].includes(incident.category)) return true;
      return false;
    });
    setFilteredIncidents(incidents);
  }, [showWaterLogging, showAccidents, showPowerCuts, showOther, allIncidents]);


  const handleSummarize = async () => {
    if (filteredIncidents.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Incidents Selected',
        description: 'Please select at least one incident type to summarize.',
      });
      return;
    }

    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeIncidents({ incidents: filteredIncidents, query: summaryQuery });
      setSummary(result.summary);
    } catch (error) {
      console.error('Summarization failed', error);
      toast({
        variant: 'destructive',
        title: 'Summarization Failed',
        description: 'Could not generate a summary. Please try again.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleOpenIncidentDialog = async (incident: Incident) => {
    setSelectedIncident(incident);
    setIsLoadingComments(true);
    const result = await getComments(incident.id);
    if(result.success && result.data){
        setComments(result.data);
    } else {
        toast({variant: 'destructive', title: 'Could not load comments.'})
    }
    setIsLoadingComments(false);
  }
  
  const handleCloseIncidentDialog = () => {
    setSelectedIncident(null);
    setComments([]);
    setNewComment("");
  }
  
  const handleUpvote = async () => {
    if(!selectedIncident) return;
    
    const originalUpvotes = selectedIncident.upvotes || 0;
    
    // Optimistic UI update
    setSelectedIncident(prev => prev ? {...prev, upvotes: (prev.upvotes || 0) + 1} : null);
    
    const result = await upvoteIncident(selectedIncident.id);
    if(!result.success){
      // Revert on failure
      setSelectedIncident(prev => prev ? {...prev, upvotes: originalUpvotes } : null);
      toast({ variant: 'destructive', title: "Upvote failed", description: result.error });
    }
  }
  
  const handleCommentSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if(!selectedIncident || !newComment.trim()) return;
      
      setIsSubmittingComment(true);
      const result = await addComment(selectedIncident.id, newComment.trim());
      
      if(result.success){
          setNewComment("");
          // Refetch comments to show the new one
          const commentsResult = await getComments(selectedIncident.id);
          if(commentsResult.success && commentsResult.data) {
              setComments(commentsResult.data);
          }
      } else {
          toast({ variant: 'destructive', title: "Failed to add comment", description: result.error });
      }
      setIsSubmittingComment(false);
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Incidents Map</h1>
          <p className="mt-4 text-lg text-muted-foreground">Visualize reported incidents on the map.</p>
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Ask AI to summarize visible incidents..."
                className="w-full h-12 pr-28"
                value={summaryQuery}
                onChange={(e) => setSummaryQuery(e.target.value)}
              />
              <Button 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9"
                onClick={handleSummarize}
                disabled={isSummarizing}
              >
                {isSummarizing ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>
        
        {summary && (
          <Card className="mb-8 shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{summary}</p>
            </CardContent>
          </Card>
        )}

        <div className="relative h-[600px]">
          {isLocating ? (
              <div className="flex h-full w-full items-center justify-center bg-muted rounded-lg">
                  <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Detecting your location...</p>
              </div>
          ) : (
            <MapComponent 
              incidents={filteredIncidents}
              onPinClick={(incident) => handleOpenIncidentDialog(incident)}
              showTraffic={showTraffic}
              aqiHeatmap={showAqi}
              incidentHeatmap={showHotspots}
              center={mapCenter}
              zoom={13}
            />
          )}
          <Card className="absolute top-4 left-4 z-10 w-72 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Map Filters ({filteredIncidents.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Droplets className="w-5 h-5 text-primary" />
                <Label htmlFor="water-logging-switch" className="flex-grow">Water Logging</Label>
                <Switch
                  id="water-logging-switch"
                  checked={showWaterLogging}
                  onCheckedChange={setShowWaterLogging}
                />
              </div>
              <div className="flex items-center space-x-3">
                <Car className="w-5 h-5 text-primary" />
                <Label htmlFor="accidents-switch" className="flex-grow">Accidents</Label>
                <Switch
                  id="accidents-switch"
                  checked={showAccidents}
                  onCheckedChange={setShowAccidents}
                />
              </div>
              <div className="flex items-center space-x-3">
                <PowerOff className="w-5 h-5 text-primary" />
                <Label htmlFor="power-cuts-switch" className="flex-grow">Power Issues</Label>
                <Switch
                  id="power-cuts-switch"
                  checked={showPowerCuts}
                  onCheckedChange={setShowPowerCuts}
                />
              </div>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <Label htmlFor="other-switch" className="flex-grow">Other</Label>
                <Switch
                  id="other-switch"
                  checked={showOther}
                  onCheckedChange={setShowOther}
                />
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className='flex items-center space-x-3'>
                      <TrafficIcon className="w-5 h-5 text-primary" />
                      <span className="flex-grow font-normal">Live Overlays</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='pt-4 space-y-4'>
                     <div className="flex items-center space-x-3">
                        <Label htmlFor="traffic-switch" className="flex-grow">Show Traffic</Label>
                        <Switch
                          id="traffic-switch"
                          checked={showTraffic}
                          onCheckedChange={setShowTraffic}
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor="aqi-switch" className="flex-grow">Show AQI</Label>
                        <Switch
                          id="aqi-switch"
                          checked={showAqi}
                          onCheckedChange={setShowAqi}
                        />
                      </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className='flex items-center space-x-3'>
                      <Flame className="w-5 h-5 text-primary" />
                      <span className="flex-grow font-normal">Data Layers</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='pt-4'>
                     <div className="flex items-center space-x-3">
                        <Label htmlFor="hotspot-switch" className="flex-grow">Show Hotspots</Label>
                        <Switch
                          id="hotspot-switch"
                          checked={showHotspots}
                          onCheckedChange={setShowHotspots}
                        />
                      </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={!!selectedIncident} onOpenChange={(isOpen) => !isOpen && handleCloseIncidentDialog()}>
            <DialogContent className="sm:max-w-lg">
                {selectedIncident && (
                    <>
                        <DialogHeader>
                            <DialogTitle className='font-headline text-2xl'>{selectedIncident.category}</DialogTitle>
                            <CardDescription>
                                <Badge>{selectedIncident.severity} Severity</Badge>
                            </CardDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <Card>
                                <CardContent className='pt-4'>
                                    <p className="text-muted-foreground">{selectedIncident.summary}</p>
                                    <div className="text-sm text-muted-foreground space-y-2 mt-4">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <span>{selectedIncident.address || `Lat: ${selectedIncident.location.latitude.toFixed(5)}, Lng: ${selectedIncident.location.longitude.toFixed(5)}`}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{format(new Date(selectedIncident.timestamp), 'PPpp')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                     <Button variant="outline" onClick={handleUpvote} className='w-full'>
                                        <ThumbsUp className="w-4 h-4 mr-2" />
                                        Upvote ({selectedIncident.upvotes || 0})
                                    </Button>
                                </CardFooter>
                            </Card>

                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5"/> Community Comments</h3>
                                <Card>
                                    <CardContent className='pt-4'>
                                        {isLoadingComments ? (
                                            <div className='flex justify-center items-center h-24'><LoaderCircle className='w-5 h-5 animate-spin' /></div>
                                        ) : comments.length > 0 ? (
                                            <div className="space-y-4">
                                                {comments.map(comment => (
                                                    <div key={comment.id} className="text-sm">
                                                        <p className="text-foreground">{comment.text}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {comment.author} &bull; {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <form onSubmit={handleCommentSubmit} className='w-full flex items-center gap-2'>
                                            <Textarea 
                                                placeholder='Add a comment...' 
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className='min-h-[40px] max-h-24'
                                                rows={1}
                                            />
                                            <Button type="submit" size="icon" disabled={isSubmittingComment || !newComment.trim()}>
                                                {isSubmittingComment ? <LoaderCircle className='w-4 h-4 animate-spin' /> : <Send className="w-4 h-4" />}
                                            </Button>
                                        </form>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
