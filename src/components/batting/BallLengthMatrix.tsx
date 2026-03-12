import { Card, CardContent } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";

export function BallLengthMatrix({ deliveries }: { deliveries: any[] }) {
  return (
    <Card className="border-border/50 bg-muted/10 border-dashed relative overflow-hidden h-[300px]">
      <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-2xl relative z-10 max-w-[240px]">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Grid3X3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-2">Coming Soon</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Detailed ball length data (Yorker, Short, etc.) is not available in current datasets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
