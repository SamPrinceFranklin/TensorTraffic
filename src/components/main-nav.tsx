
'use client';

import { usePathname } from 'next/navigation';
import { Home, FileText, Map, AlertTriangle, Shield, BrainCircuit, Route, Bot, Menu, LineChart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { useState } from 'react';

export function MainNav() {
  const pathname = usePathname();
  const { isMobile } = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);


  const menuItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/report-incident',
      label: 'Report Incident',
      icon: FileText,
    },
    {
      href: '/map',
      label: 'Map',
      icon: Map,
    },
     {
      href: '/analytics',
      label: 'Analytics',
      icon: LineChart,
    },
    {
      href: '/accidents-near-you',
      label: 'Accidents Near You',
      icon: AlertTriangle,
    },
    {
      href: '/parental-alerts',
      label: 'Parental Alerts',
      icon: Shield,
    },
    {
      href: '/predictive-alerts',
      label: 'Predictive Alerts',
      icon: BrainCircuit,
    },
    {
      href: '/route-alerts',
      label: 'Route Alerts',
      icon: Route,
    },
    {
      href: '/live-agent',
      label: 'Live Agent',
      icon: Bot,
    },
  ];

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
        "flex items-center text-sm font-medium",
        isMobile ? "flex-col space-y-4 items-start" : "space-x-6"
    )}>
        {menuItems.map((item) => (
        <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={cn(
            'flex items-center gap-2 transition-colors hover:text-primary',
            pathname === item.href ? 'text-primary' : 'text-muted-foreground',
            isMobile && 'text-lg'
            )}
        >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
        </Link>
        ))}
    </nav>
  );

  if (isMobile) {
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="mr-4 flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    <span className="font-bold font-headline text-xl">TensorTraffic</span>
                </Link>
                </div>
                 <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                            <span className="sr-only">Open Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className='pt-12'>
                        <SheetHeader className='mb-4'>
                           <SheetTitle className='font-headline text-2xl text-left'>
                                TensorTraffic
                           </SheetTitle>
                        </SheetHeader>
                        <NavLinks isMobile />
                    </SheetContent>
                </Sheet>
            </div>
       </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-bold font-headline text-xl">TensorTraffic</span>
          </Link>
        </div>
        <NavLinks />
      </div>
    </header>
  );
}
