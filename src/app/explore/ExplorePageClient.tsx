"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ExploreView from "@/views/ExploreView";

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ExplorePageClient() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ExploreView />
    </Suspense>
  );
}
