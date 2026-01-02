"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

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

        // Update localStorage with fresh user data
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/client");
        }
      } catch {
        localStorage.removeItem("user");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
}
