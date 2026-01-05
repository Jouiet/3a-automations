"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been deprecated - all automations are now native scripts
// Redirect to the automations page
export default function WorkflowsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/automations");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <p className="text-muted-foreground">Redirection vers Automations...</p>
      </div>
    </div>
  );
}
