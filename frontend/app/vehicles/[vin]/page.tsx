import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleGallery } from "@/components/vehicle-gallery";
import type { VehicleOut } from "@/lib/types";
import { getVehicle } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PageParams {
  params: Promise<{ vin: string }>;
}

export default async function VehicleDetailPage({ params }: PageParams) {
  const { vin: rawVin } = await params;
  const vin = decodeURIComponent(rawVin);
  let vehicle: VehicleOut | null = null;

  try {
    vehicle = await getVehicle(vin);
  } catch (error) {
    console.error("Vehicle fetch failed:", error);
    notFound();
  }

  if (!vehicle) {
    notFound();
  }

  const fallbackGallery = [
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=900&auto=format&fit=crop",
  ];

  const normalizedGallery = (vehicle.image_urls ?? []).filter((url) => Boolean(url?.trim()));

  const gallery = normalizedGallery.length ? normalizedGallery : fallbackGallery;

  const heroImage = gallery[0] ?? fallbackGallery[0];
  const createdAt = vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }) : "Recently added";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] animate-pulse [animation-delay:1.5s]" />
      </div>

      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl py-4 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 hover:scale-105 transition-transform duration-200">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Collection
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold text-gradient hidden sm:block">
            {vehicle.make} {vehicle.model}
          </h1>
          <Badge variant="success" className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4" />
            VIN Verified
          </Badge>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-2xl animate-fade-in-up">
          <div className="relative h-[400px] lg:h-[500px] overflow-hidden group">
            <img
              src={heroImage}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4 animate-fade-in-up stagger-1">
                <Badge variant="success">Available</Badge>
                <Badge variant="outline">Added · {createdAt}</Badge>
              </div>
              <div className="space-y-2 animate-fade-in-up stagger-2">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient">
                  {vehicle.make} {vehicle.model}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* Details Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Overview */}
            <Card variant="glass" className="animate-fade-in-up stagger-3">
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Essential specifications and information.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DetailItem 
                  label="VIN" 
                  value={vehicle.vin} 
                  icon={<ShieldCheckIcon className="h-5 w-5 text-primary" />} 
                />
                <DetailItem 
                  label="Make" 
                  value={vehicle.make} 
                  icon={<CarIcon className="h-5 w-5 text-accent" />} 
                />
                <DetailItem 
                  label="Model" 
                  value={vehicle.model} 
                  icon={<SparklesIcon className="h-5 w-5 text-primary" />} 
                />
                <DetailItem 
                  label="Added On" 
                  value={createdAt} 
                  icon={<CalendarIcon className="h-5 w-5 text-accent" />} 
                />
              </CardContent>
            </Card>

            {/* Description */}
            <Card variant="glass" className="animate-fade-in-up stagger-4">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {vehicle.description}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card variant="glass" className="animate-fade-in-up stagger-5">
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>What makes this vehicle special.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FeatureItem 
                  icon={<ShieldCheckIcon className="h-5 w-5" />} 
                  title="Verified History" 
                  body="Complete vehicle history and documentation available." 
                />
                <FeatureItem 
                  icon={<GaugeIcon className="h-5 w-5" />} 
                  title="Performance Ready" 
                  body="Maintained to optimal performance standards." 
                />
                <FeatureItem 
                  icon={<SparklesIcon className="h-5 w-5" />} 
                  title="Quality Assured" 
                  body="Thoroughly inspected and quality certified." 
                />
                <FeatureItem 
                  icon={<PhoneIcon className="h-5 w-5" />} 
                  title="Support Available" 
                  body="Dedicated assistance throughout your journey." 
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" className="sticky top-24 animate-fade-in-up stagger-4">
              <CardHeader>
                <CardTitle>Interested?</CardTitle>
                <CardDescription>Get in touch to learn more about this vehicle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <p className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</p>
                </div>
                <Button variant="primary" size="lg" className="w-full hover-lift">
                  <PhoneIcon className="h-5 w-5" />
                  Schedule a Viewing
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Our team is ready to assist you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Gallery */}
        <VehicleGallery gallery={gallery} make={vehicle.make} model={vehicle.model} />
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-lg font-semibold font-display mb-2 text-black dark:text-white">Tummala Motors</p>
          <p className="text-sm text-muted-foreground">Vehicle inventory management</p>
        </div>
      </footer>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/30 group">
      <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg group">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}
