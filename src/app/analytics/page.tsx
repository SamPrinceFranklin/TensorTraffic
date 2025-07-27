
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getIncidents } from '@/lib/incidents-service';
import { Incident } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, AlertTriangle, BarChart2, PieChart as PieChartIcon, Sparkles, CheckSquare, List, Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { summarizeTrends, SummarizeTrendsOutput } from '@/ai/flows/summarize-trends-flow';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560"];

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SummarizeTrendsOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchIncidents = async () => {
      setIsLoading(true);
      const result = await getIncidents();
      if (result.success && result.data) {
        setIncidents(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load incidents',
          description: result.error || 'Could not fetch incidents from the server.',
        });
      }
      setIsLoading(false);
    };
    fetchIncidents();
  }, [toast]);
  
  useEffect(() => {
      if(incidents.length > 0){
          const runAnalysis = async () => {
              setIsAnalyzing(true);
              try {
                  const result = await summarizeTrends({ incidents });
                  setAnalysis(result);
              } catch (e: any) {
                  toast({ variant: 'destructive', title: 'Trend analysis failed', description: e.message });
              } finally {
                  setIsAnalyzing(false);
              }
          }
          runAnalysis();
      }
  }, [incidents, toast]);

  const incidentsByCategory = useMemo(() => {
    const counts = incidents.reduce((acc, incident) => {
      acc[incident.category] = (acc[incident.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [incidents]);

  const incidentsByDay = useMemo(() => {
    const counts = incidents.reduce((acc, incident) => {
        const day = format(parseISO(incident.timestamp), 'eeee');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek.map(day => ({ name: day, incidents: counts[day] || 0 }));
  }, [incidents]);

  const chartConfigCategory: ChartConfig = useMemo(() => {
      const config: ChartConfig = {};
      incidentsByCategory.forEach((item, index) => {
          config[item.name] = { 
            label: item.name,
            color: COLORS[index % COLORS.length]
          };
      });
      return config;
  }, [incidentsByCategory]);
  
  const chartConfigDays: ChartConfig = {
      incidents: { label: "Incidents", color: "hsl(var(--primary))" },
  }

  const handleDownload = () => {
    if (incidents.length === 0) {
      toast({ variant: 'destructive', title: 'No data to download.' });
      return;
    }

    const headers = ['ID', 'Category', 'Severity', 'Timestamp', 'Latitude', 'Longitude', 'Address', 'Summary', 'Upvotes'];
    const csvRows = [headers.join(',')];
    
    const escapeCsvCell = (cell: any) => {
        const cellStr = String(cell ?? '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
    }

    incidents.forEach(incident => {
        const row = [
            incident.id,
            incident.category,
            incident.severity,
            incident.timestamp,
            incident.location.latitude,
            incident.location.longitude,
            incident.address || '',
            escapeCsvCell(incident.summary),
            incident.upvotes || 0
        ].join(',');
        csvRows.push(row);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'tensor_traffic_incidents.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Download Started', description: 'The incident data is being downloaded.' });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
            <div className='flex flex-col sm:flex-row items-center justify-center relative'>
                <div className='flex-1'>
                    <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Incident Analytics</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Visualizing trends and patterns in reported data.
                    </p>
                </div>
                <div className='mt-4 sm:mt-0 sm:absolute sm:right-0'>
                    <Button variant="outline" onClick={handleDownload} disabled={incidents.length === 0}>
                        <Download className='w-4 h-4 mr-2'/>
                        Download Data
                    </Button>
                </div>
            </div>
        </header>
        
        {isAnalyzing || analysis ? (
            <Card className="mb-8 shadow-lg animate-in fade-in-50">
                <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    AI Trend Analysis
                </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                    {isAnalyzing ? (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <LoaderCircle className='w-5 h-5 animate-spin' />
                            <p>Analyzing data to find trends...</p>
                        </div>
                    ) : analysis ? (
                        <>
                            <p className="text-muted-foreground leading-relaxed">{analysis.trendSummary}</p>
                            <div>
                                <h3 className='font-semibold text-lg flex items-center gap-2 mb-2'><List className='w-5 h-5' /> Key Observations</h3>
                                <ul className="space-y-2 list-disc pl-5">
                                    {analysis.keyObservations.map((item, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <CheckSquare className='w-4 h-4 mt-1 shrink-0 text-primary/70' />
                                        <span>{item}</span>
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : null}
                </CardContent>
            </Card>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><PieChartIcon className='w-5 h-5' />Incidents by Category</CardTitle>
              <CardDescription>Distribution of all reported incident types.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigCategory} className="mx-auto aspect-square max-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={incidentsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {incidentsByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                         <Legend />
                    </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'><BarChart2 className='w-5 h-5' />Incidents by Day of Week</CardTitle>
              <CardDescription>Total number of incidents reported each day.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigDays} className="mx-auto aspect-video max-h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incidentsByDay}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent hideIndicator />} />
                        <Bar dataKey="incidents" fill="var(--color-incidents)" radius={4} />
                    </BarChart>
                 </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        {incidents.length === 0 && !isLoading && (
            <Card className="mt-8">
                <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Data Available</h3>
                    <p className="text-muted-foreground mt-2">There is no incident data to analyze yet. Please report an incident to get started.</p>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
