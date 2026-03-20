"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Index from "../views/Index";

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Index />
    </Suspense>
  );
}

