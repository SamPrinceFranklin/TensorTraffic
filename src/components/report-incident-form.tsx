
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { analyzeIncidentReport, type AnalyzeIncidentReportOutput } from '@/ai/flows/analyze-incident-report';
import { saveIncidentReport } from '@/lib/incidents-service';
import { initiateAgentCall } from '@/ai/flows/initiate-agent-call-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, MapPin, FileText, LoaderCircle, Sparkles, Server, PhoneOutgoing } from 'lucide-react';
import Image from 'next/image';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { useJsApiLoader } from '@react-google-maps/api';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MapComponent } from './map';
import { PlacesAutocompleteInput } from './places-autocomplete-input';
import { PlaceDetails } from '@/lib/places-service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

const formSchema = z.object({
  media: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, 'An image or video file is required.')
    .refine((files) => files && files[0]?.size <= MAX_FILE_SIZE, `Max file size is 50MB.`)
    .refine(
      (files) => files && ACCEPTED_MEDIA_TYPES.includes(files[0]?.type),
      'Unsupported file format. Please upload an image or video.'
    ),
  description: z.string().max(1000, 'Description must be 1000 characters or less.').optional(),
});

type LocationState = {
  latitude: number;
  longitude: number;
  address?: string;
  error?: string | null;
} | null;

type LocationMode = 'auto' | 'manual';

export function ReportIncidentForm() {
  const [autoLocation, setAutoLocation] = useState<LocationState>(null);
  const [manualLocation, setManualLocation] = useState<LocationState>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('auto');

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeIncidentReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      media: undefined,
      description: '',
    },
  });

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'routes', 'geometry', 'geocoding', 'visualization'],
  });

  const activeLocation = locationMode === 'auto' ? autoLocation : manualLocation;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setAutoLocation(newLocation);
        },
        (error) => {
          setAutoLocation({ latitude: 0, longitude: 0, error: `Location access denied. Analysis may be less accurate.` });
        }
      );
    } else {
      setAutoLocation({ latitude: 0, longitude: 0, error: "Geolocation is not supported by this browser." });
    }
  }, []);

  const getAddressFromGeocode = (lat: number, lng: number, setter: (loc: LocationState) => void) => {
      if(isMapLoaded && window.google) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setter({ latitude: lat, longitude: lng, address: results[0].formatted_address });
            } else {
                setter({ latitude: lat, longitude: lng, address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}` });
            }
        });
      }
  }

  useEffect(() => {
    if (autoLocation && !autoLocation.address && !autoLocation.error && isMapLoaded) {
      getAddressFromGeocode(autoLocation.latitude, autoLocation.longitude, setAutoLocation);
    }
  }, [autoLocation, isMapLoaded]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      form.setValue('media', files, { shouldValidate: true });
      handleFileChange({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };
  
  const handleSaveToFirestore = async () => {
    if (!analysisResult || !activeLocation) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save',
        description: 'No analysis result or location data available to save.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveIncidentReport({
        location: { latitude: activeLocation.latitude, longitude: activeLocation.longitude },
        category: analysisResult.incidentCategory,
        severity: analysisResult.severity,
        summary: analysisResult.summaryReport,
        address: activeLocation.address,
      });

      if (result.success) {
        toast({
          title: 'Report Saved',
          description: `The incident report has been successfully saved with ID: ${result.id}`,
        });
      } else {
        throw new Error(result.error || 'Unknown error saving to Firestore');
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: e.message || 'Something went wrong while saving the report.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAgentCall = async () => {
    if (!analysisResult || !activeLocation) return;
    setIsCalling(true);
    try {
       const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
       const agentPhoneNumberId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_PHONE_NUMBER_ID;
       const toNumber = process.env.NEXT_PUBLIC_EMERGENCY_CONTACT_NUMBER;

       if (!agentId || !agentPhoneNumberId || !toNumber) {
         throw new Error('Required environment variables for ElevenLabs agent call are not set.');
       }

       const summary = `
        New Incident Report: ${analysisResult.callSummary}.
        Location: ${activeLocation.address || `Latitude ${activeLocation.latitude}, Longitude ${activeLocation.longitude}`}.
       `;

       const result = await initiateAgentCall({
         agentId,
         agentPhoneNumberId,
         toNumber,
         incidentSummary: summary,
       });

       if (result.success) {
         toast({
           title: 'Call Initiated Successfully',
           description: `Call in progress. SID: ${result.callSid || 'N/A'}.`,
         });
       } else {
         throw new Error(result.message || 'An unknown error occurred during the call.');
       }

    } catch(e: any) {
       console.error(e);
       toast({
         variant: 'destructive',
         title: 'Failed to Initiate Call',
         description: e.message,
       });
    } finally {
      setIsCalling(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeLocation) {
      toast({
        variant: 'destructive',
        title: 'Location Required',
        description: 'Location data is still being determined. Please wait a moment.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    const file = values.media[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        const mediaDataUri = reader.result as string;
        const result = await analyzeIncidentReport({
          mediaDataUri,
          description: values.description || '',
          location: { latitude: activeLocation.latitude, longitude: activeLocation.longitude },
        });
        setAnalysisResult(result);
        toast({
          title: 'Analysis Complete',
          description: 'The incident report has been successfully analyzed.',
        });
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Something went wrong while analyzing the incident. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: 'There was an error reading the file.',
      });
      setIsLoading(false);
    };
  }

  const handleManualMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
        getAddressFromGeocode(e.latLng.lat(), e.latLng.lng(), setManualLocation);
    }
  }

  const handleManualPlaceSelect = (place: PlaceDetails) => {
      setManualLocation({
          latitude: place.location.lat,
          longitude: place.location.lng,
          address: place.address,
      });
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">Report an Incident</CardTitle>
              <CardDescription>Fill out the details below to submit an incident report.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="media"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Incident Media</FormLabel>
                    <FormControl>
                      <div
                        className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors h-64 flex flex-col items-center justify-center"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                      >
                        {mediaPreview ? (
                          mediaType?.startsWith('video') ? (
                            <video src={mediaPreview} className="absolute inset-0 w-full h-full object-cover rounded-md" controls />
                          ) : (
                            <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" className="rounded-md" />
                          )
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <UploadCloud className="w-12 h-12" />
                            <span className="font-semibold">Click to upload or drag and drop</span>
                            <span className="text-sm">Image or Video (Max 50MB)</span>
                          </div>
                        )}
                        <Input
                          {...field}
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_MEDIA_TYPES.join(',')}
                          value={undefined}
                          onChange={(e) => {
                            field.onChange(e.target.files);
                            handleFileChange(e);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Location</Label>
                <RadioGroup value={locationMode} onValueChange={(v) => setLocationMode(v as LocationMode)} className="flex space-x-4">
                  <div className='flex items-center space-x-2'><RadioGroupItem value="auto" id="auto" /><Label htmlFor="auto">Use my current location</Label></div>
                  <div className='flex items-center space-x-2'><RadioGroupItem value="manual" id="manual" /><Label htmlFor="manual">Select manually</Label></div>
                </RadioGroup>
                
                 <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div className='flex-grow'>
                        {activeLocation ? (
                            activeLocation.error ? (
                            <p className="text-sm text-destructive">{activeLocation.error}</p>
                            ) : (
                            <div>
                                <p className="text-sm font-mono">Lat: {activeLocation.latitude.toFixed(5)}, Lng: {activeLocation.longitude.toFixed(5)}</p>
                                <p className="text-sm text-muted-foreground">{activeLocation.address || 'Resolving address...'}</p>
                            </div>
                            )
                        ) : (
                             <p className="text-sm text-muted-foreground">{locationMode === 'auto' ? "Detecting location..." : "Please select a location."}</p>
                        )}
                    </div>
                    {locationMode === 'manual' && (
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Select Location</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-4">
                                <DialogHeader>
                                    <DialogTitle>Select Incident Location</DialogTitle>
                                </DialogHeader>
                                <div className="flex-shrink-0">
                                    <PlacesAutocompleteInput 
                                        label="" 
                                        onPlaceSelect={handleManualPlaceSelect} 
                                        icon={() => <MapPin className='w-5 h-5' />} 
                                    />
                                </div>
                                <div className="flex-grow w-full rounded-md overflow-hidden mt-4">
                                    <MapComponent
                                        incidents={manualLocation ? [{ id: 'manual', category: 'Other', severity: 'Low', summary: '', timestamp: '', location: {latitude: manualLocation.latitude, longitude: manualLocation.longitude} }] : []}
                                        onMapClick={handleManualMapClick}
                                        onPinClick={() => {}}
                                        center={manualLocation ? { lat: manualLocation.latitude, lng: manualLocation.longitude } : (autoLocation ? {lat: autoLocation.latitude, lng: autoLocation.longitude} : undefined)}
                                        zoom={manualLocation ? 15 : 12}
                                    />
                                </div>
                                <Button onClick={() => setIsModalOpen(false)} className='w-full mt-4 flex-shrink-0'>
                                    Confirm Location
                                </Button>
                            </DialogContent>
                        </Dialog>
                    )}
                 </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Optional Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide any additional details about the incident..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isSaving} className="w-full text-lg py-6">
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze and Report Incident'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisResult && (
        <Card className="mt-8 shadow-lg animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Analysis Report
            </CardTitle>
            <CardDescription>Here is the AI-generated analysis of the incident.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-primary">Location</h3>
              <p className="text-lg bg-muted p-3 rounded-md mt-1">{activeLocation?.address || 'Not available'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">Incident Category</h3>
              <p className="text-lg bg-muted p-3 rounded-md mt-1">{analysisResult.incidentCategory}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">Severity</h3>
              <p className="text-lg bg-muted p-3 rounded-md mt-1">{analysisResult.severity}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">Summary Report</h3>
              <p className="text-muted-foreground leading-relaxed bg-muted p-3 rounded-md mt-1">{analysisResult.summaryReport}</p>
            </div>
          </CardContent>
           <CardFooter className='flex-col sm:flex-row gap-4'>
             <Button onClick={handleSaveToFirestore} disabled={isSaving || isLoading || isCalling} className="w-full">
               {isSaving ? (
                 <>
                   <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                   Saving Report...
                 </>
               ) : (
                 <>
                  <Server className="mr-2 h-4 w-4" />
                   Save Report
                 </>
               )}
             </Button>
             <Button onClick={handleAgentCall} variant="destructive" disabled={isCalling || isSaving || isLoading || !activeLocation?.address} className="w-full">
                {isCalling ? (
                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Calling...</>
                ) : (
                    <><PhoneOutgoing className="mr-2 h-4 w-4" />Call Emergency Services</>
                )}
             </Button>
           </CardFooter>
        </Card>
      )}
    </div>
  );
}
