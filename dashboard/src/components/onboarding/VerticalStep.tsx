"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Building2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

export type VerticalType = "shopify" | "b2b" | "custom";

interface VerticalOption {
  id: VerticalType;
  name: string;
  description: string;
  icon: typeof ShoppingBag;
  features: string[];
  recommended?: boolean;
}

const VERTICALS: VerticalOption[] = [
  {
    id: "shopify",
    name: "E-commerce Shopify",
    description: "Store automation, product management, and customer insights",
    icon: ShoppingBag,
    features: [
      "Product sync & enrichment",
      "Order automation",
      "Customer segmentation",
      "Inventory alerts",
      "Review automation",
      "Abandoned cart recovery",
    ],
    recommended: true,
  },
  {
    id: "b2b",
    name: "B2B Services",
    description: "Lead generation, CRM integration, and sales automation",
    icon: Building2,
    features: [
      "Lead scoring",
      "HubSpot/Salesforce sync",
      "Email outreach",
      "Meeting scheduling",
      "Pipeline automation",
      "Contract generation",
    ],
  },
  {
    id: "custom",
    name: "Custom Agency",
    description: "Tailored automation solutions for your specific needs",
    icon: Briefcase,
    features: [
      "Custom integrations",
      "Bespoke workflows",
      "API development",
      "White-label solutions",
      "Multi-platform sync",
      "Advanced reporting",
    ],
  },
];

interface VerticalStepProps {
  selected: VerticalType | null;
  onChange: (vertical: VerticalType) => void;
}

export function VerticalStep({ selected, onChange }: VerticalStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Business Type</h2>
        <p className="text-muted-foreground">
          Select the vertical that best describes your business to customize your automation suite
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {VERTICALS.map((vertical) => {
          const isSelected = selected === vertical.id;
          const Icon = vertical.icon;

          return (
            <Card
              key={vertical.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:border-primary/50",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/50"
              )}
              onClick={() => onChange(vertical.id)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "p-3 rounded-xl transition-colors",
                      isSelected ? "bg-primary/20" : "bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  {vertical.recommended && (
                    <Badge variant="default" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                  {isSelected && !vertical.recommended && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{vertical.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {vertical.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {vertical.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
