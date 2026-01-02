"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientSidebar } from "@/components/layouts/client-sidebar";
import { ClientHeader } from "@/components/layouts/client-header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify auth via API (uses httpOnly cookie)
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });

        if (!response.ok) {
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const data = await response.json();
        const user = data.data;

        // Clients and admins can access client portal
        if (user.role === "CLIENT" || user.role === "ADMIN") {
          // Update localStorage with fresh user data
          localStorage.setItem("user", JSON.stringify(user));
          setIsAuthorized(true);
        } else {
          router.push("/login");
        }
      } catch {
        localStorage.removeItem("user");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientSidebar />
      <div className="pl-64 transition-all duration-300">
        <ClientHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
