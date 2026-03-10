import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <Card className="border-border">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
        {icon || <span className="text-4xl opacity-40">🏏</span>}
        <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
      </CardContent>
    </Card>
  );
}
