"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Zap,
  Mail,
  Users,
  TrendingUp,
  ShoppingCart,
  Star,
  RefreshCw,
  AlertTriangle,
  Bot,
  CheckCircle2,
} from "lucide-react";
import type { VerticalType } from "./VerticalStep";

interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Zap;
  category: "acquisition" | "retention" | "operations" | "analytics";
  recommended?: boolean;
  availableFor?: VerticalType[];
  premium?: boolean;
}

const FEATURES: FeatureConfig[] = [
  {
    id: "churn_prediction",
    name: "Churn Prediction AI",
    description: "Identify at-risk customers before they leave",
    icon: AlertTriangle,
    category: "retention",
    recommended: true,
    availableFor: ["shopify", "b2b"],
  },
  {
    id: "review_automation",
    name: "Review Automation",
    description: "Automated review requests and management",
    icon: Star,
    category: "retention",
    recommended: true,
    availableFor: ["shopify"],
  },
  {
    id: "abandoned_cart",
    name: "Abandoned Cart Recovery",
    description: "Multi-channel cart recovery campaigns",
    icon: ShoppingCart,
    category: "acquisition",
    recommended: true,
    availableFor: ["shopify"],
  },
  {
    id: "email_personalization",
    name: "Email Personalization",
    description: "AI-powered email content and timing",
    icon: Mail,
    category: "retention",
    availableFor: ["shopify", "b2b", "custom"],
  },
  {
    id: "lead_scoring",
    name: "Lead Scoring",
    description: "AI-powered lead qualification",
    icon: Users,
    category: "acquisition",
    recommended: true,
    availableFor: ["b2b", "custom"],
  },
  {
    id: "replenishment",
    name: "Replenishment Reminders",
    description: "Smart reorder notifications",
    icon: RefreshCw,
    category: "retention",
    availableFor: ["shopify"],
  },
  {
    id: "price_drop_alerts",
    name: "Price Drop Alerts",
    description: "Notify customers of price changes",
    icon: TrendingUp,
    category: "acquisition",
    availableFor: ["shopify"],
  },
  {
    id: "voice_assistant",
    name: "Voice AI Assistant",
    description: "Conversational AI for customer support",
    icon: Bot,
    category: "operations",
    premium: true,
    availableFor: ["shopify", "b2b", "custom"],
  },
];

const CATEGORY_LABELS = {
  acquisition: "Acquisition",
  retention: "Retention",
  operations: "Operations",
  analytics: "Analytics",
};

interface FeaturesStepProps {
  vertical: VerticalType | null;
  features: Record<string, boolean>;
  onChange: (featureId: string, enabled: boolean) => void;
}

export function FeaturesStep({ vertical, features, onChange }: FeaturesStepProps) {
  const availableFeatures = FEATURES.filter(
    (f) => !f.availableFor || !vertical || f.availableFor.includes(vertical)
  );

  const categories = [...new Set(availableFeatures.map((f) => f.category))];
  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Your Features</h2>
        <p className="text-muted-foreground">
          Choose the automations you want to enable. You can change these anytime.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant={enabledCount > 0 ? "default" : "secondary"}>
            {enabledCount} features enabled
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categoryFeatures = availableFeatures.filter((f) => f.category === category);

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {categoryFeatures.map((feature) => {
                  const isEnabled = features[feature.id] || false;
                  const Icon = feature.icon;

                  return (
                    <Card
                      key={feature.id}
                      className={cn(
                        "transition-all cursor-pointer",
                        isEnabled
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 hover:border-border"
                      )}
                      onClick={() => onChange(feature.id, !isEnabled)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-lg shrink-0",
                                isEnabled ? "bg-primary/20" : "bg-muted/50"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  isEnabled ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{feature.name}</h4>
                                {feature.recommended && (
                                  <Badge variant="outline" className="text-xs py-0">
                                    Recommended
                                  </Badge>
                                )}
                                {feature.premium && (
                                  <Badge variant="secondary" className="text-xs py-0">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => onChange(feature.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {enabledCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {enabledCount} feature{enabledCount > 1 ? "s" : ""} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  These will be configured based on your connected integrations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
