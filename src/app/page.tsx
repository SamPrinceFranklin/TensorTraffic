import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIncidents } from '@/lib/incidents-service';
import { Incident } from '@/lib/types';
import { AlertTriangle, Car, Construction, Droplets, FileText, PowerOff, ShieldAlert, ShieldCheck, ShieldBan, TreeDeciduous, TrafficCone } from 'lucide-react';
import Link from 'next/link';

// Helper function to count incidents by category
const countByCategory = (incidents: Incident[]) => {
  const counts: { [key: string]: number } = {};
  for (const incident of incidents) {
    counts[incident.category] = (counts[incident.category] || 0) + 1;
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
};

// Helper function to count incidents by severity
const countBySeverity = (incidents: Incident[]) => {
  const counts: { [key: string]: number } = { Low: 0, Medium: 0, High: 0 };
  for (const incident of incidents) {
    if (counts[incident.severity] !== undefined) {
      counts[incident.severity]++;
    }
  }
  return counts;
};

const categoryIcons: { [key: string]: React.ElementType } = {
    'Water Logging': Droplets,
    'Road Accidents': Car,
    'Accident': Car,
    'Fire Accidents': TrafficCone,
    'Electrical Issues': PowerOff,
    'PowerCut': PowerOff,
    'Drainage/Fallen Tree': TreeDeciduous,
    'Road Blockages': TrafficCone,
    'Construction Zones': Construction,
    'Other': AlertTriangle,
};

const MetricCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

export default async function Home() {
  const { data: incidents, error } = await getIncidents();

  if (error) {
    return (
       <div className="bg-background min-h-screen flex items-center justify-center">
         <Card className="w-full max-w-md mx-4">
           <CardHeader>
             <CardTitle className="text-destructive">Error Loading Data</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">Could not load incident data for the dashboard. The following error occurred:</p>
             <p className="mt-4 font-mono bg-muted p-2 rounded text-sm text-destructive">{error}</p>
           </CardContent>
         </Card>
       </div>
    )
  }
  
  const totalIncidents = incidents?.length || 0;
  const severityCounts = countBySeverity(incidents || []);
  const categoryCounts = countByCategory(incidents || []);

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Welcome to TensorTraffic</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A real-time overview of civic incidents.
          </p>
        </div>

        <div className="mt-12 max-w-4xl mx-auto space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Incidents" value={totalIncidents} icon={AlertTriangle} description="Total reports filed." />
                <MetricCard title="High Severity" value={severityCounts.High} icon={ShieldBan} description="Critical incidents." />
                <MetricCard title="Medium Severity" value={severityCounts.Medium} icon={ShieldAlert} description="Moderate incidents." />
                <MetricCard title="Low Severity" value={severityCounts.Low} icon={ShieldCheck} description="Minor incidents." />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Incidents by Category</CardTitle>
                    <CardDescription>Breakdown of all reported incidents.</CardDescription>
                </CardHeader>
                <CardContent>
                    {categoryCounts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categoryCounts.map(({name, count}) => {
                                const Icon = categoryIcons[name] || AlertTriangle;
                                return (
                                    <div key={name} className="flex items-center gap-3 bg-muted p-3 rounded-lg">
                                        <Icon className="w-6 h-6 text-primary" />
                                        <div>
                                            <p className="font-semibold">{name}</p>
                                            <p className="text-sm text-muted-foreground">{count} {count > 1 ? 'reports' : 'report'}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No incidents reported yet.
                        </div>
                    )}
                </CardContent>
            </Card>

             <div className="text-center pt-6">
                <Button asChild size="lg">
                <Link href="/report-incident">
                    <FileText className="mr-2" />
                    Report a New Incident
                </Link>
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
}
