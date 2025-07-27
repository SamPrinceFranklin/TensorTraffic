import { ReportIncidentForm } from '@/components/report-incident-form';

export default function ReportIncidentPage() {
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8 md:py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">Report an Incident</h1>
          <p className="mt-4 text-lg text-muted-foreground">Fill out the form below to submit an incident report.</p>
        </header>
        <ReportIncidentForm />
      </main>
    </div>
  );
}
