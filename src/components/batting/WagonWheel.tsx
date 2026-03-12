import { Card, CardContent } from "@/components/ui/card";
import { Map } from "lucide-react";

export function WagonWheel({ deliveries }: { deliveries: any[] }) {
  return (
    <Card className="border-border/50 bg-muted/10 border-dashed relative overflow-hidden h-[300px]">
      <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg viewBox="-120 -120 240 240" className="w-full h-full">
            <circle cx="0" cy="0" r="100" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="0" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <rect x="-3" y="-12" width="6" height="24" fill="currentColor" rx="1" />
          </svg>
        </div>
        
        <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-2xl relative z-10 max-w-[240px]">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Map className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-2">Coming Soon</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ball coordinate data is not available in Cricsheet datasets at this time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
