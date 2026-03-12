import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || "ErrorBoundary"}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 rounded-[2rem] glass border-rose-500/20 bg-rose-500/5 min-h-[300px] text-center">
          <div className="p-4 bg-rose-500/10 rounded-2xl mb-6">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-2">Module Interruption</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 font-medium">
            An unexpected telemetry error occurred while rendering the {this.props.name || "requested module"}. 
            Technical details have been logged for analysis.
          </p>
          <Button 
            onClick={this.handleReset}
            variant="outline"
            className="rounded-xl border-white/10 hover:bg-white/5 gap-2 px-6 h-12 text-xs font-black uppercase tracking-widest"
          >
            <RefreshCcw className="h-4 w-4" />
            Re-initialize Module
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
