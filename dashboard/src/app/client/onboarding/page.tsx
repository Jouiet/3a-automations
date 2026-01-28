"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Zap,
  Building2,
  Link2,
  Settings2,
  Mic,
  Code,
} from "lucide-react";

import {
  VerticalStep,
  IntegrationsStep,
  FeaturesStep,
  VoiceStep,
  EmbedStep,
  type VerticalType,
  type IntegrationState,
  type VoiceLanguage,
  type VoicePersona,
} from "@/components/onboarding";

interface OnboardingStep {
  id: number;
  name: string;
  description: string;
  icon: typeof Zap;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    name: "Business Type",
    description: "Select your vertical",
    icon: Building2,
  },
  {
    id: 2,
    name: "Integrations",
    description: "Connect services",
    icon: Link2,
  },
  {
    id: 3,
    name: "Features",
    description: "Choose automations",
    icon: Settings2,
  },
  {
    id: 4,
    name: "Voice AI",
    description: "Configure assistant",
    icon: Mic,
  },
  {
    id: 5,
    name: "Embed",
    description: "Install widget",
    icon: Code,
  },
];

interface OnboardingState {
  vertical: VerticalType | null;
  integrations: Record<string, IntegrationState>;
  features: Record<string, boolean>;
  voice: {
    language: VoiceLanguage;
    persona: VoicePersona;
  };
}

const DEFAULT_STATE: OnboardingState = {
  vertical: null,
  integrations: {},
  features: {
    churn_prediction: true,
    review_automation: true,
    abandoned_cart: true,
    email_personalization: false,
    lead_scoring: false,
    replenishment: false,
    price_drop_alerts: false,
    voice_assistant: false,
  },
  voice: {
    language: "fr",
    persona: "professional",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Get tenant ID from URL or localStorage
  useEffect(() => {
    const urlTenantId = searchParams.get("tenant_id");
    if (urlTenantId) {
      setTenantId(urlTenantId);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setTenantId(user.tenant_id || user.id || "demo-tenant");
      } else {
        setTenantId("demo-tenant");
      }
    }
  }, [searchParams]);

  // Check for OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const provider = searchParams.get("provider");

    if (success && provider) {
      setState((prev) => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          [provider]: {
            id: provider,
            connected: true,
            loading: false,
            connectedAt: new Date().toISOString(),
          },
        },
      }));
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return state.vertical !== null;
      case 2:
        // At least one integration connected OR allow skip
        return true;
      case 3:
        return Object.values(state.features).some(Boolean);
      case 4:
        return state.voice.language && state.voice.persona;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!tenantId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: state.vertical,
          features: state.features,
          voice_config: state.voice,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        router.push("/client?onboarding=complete");
      } else {
        console.error("Failed to save onboarding");
      }
    } catch (error) {
      console.error("Onboarding save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleIntegrationConnect = (integrationId: string) => {
    setState((prev) => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [integrationId]: {
          id: integrationId,
          connected: false,
          loading: true,
        },
      },
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <VerticalStep
            selected={state.vertical}
            onChange={(vertical) => setState({ ...state, vertical })}
          />
        );
      case 2:
        return (
          <IntegrationsStep
            vertical={state.vertical}
            integrations={state.integrations}
            onConnect={handleIntegrationConnect}
            tenantId={tenantId || undefined}
          />
        );
      case 3:
        return (
          <FeaturesStep
            vertical={state.vertical}
            features={state.features}
            onChange={(featureId, enabled) =>
              setState({
                ...state,
                features: { ...state.features, [featureId]: enabled },
              })
            }
          />
        );
      case 4:
        return (
          <VoiceStep
            config={state.voice}
            onChange={(voice) => setState({ ...state, voice })}
          />
        );
      case 5:
        return <EmbedStep tenantId={tenantId || "demo-tenant"} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">3A Automation</h1>
                <p className="text-xs text-muted-foreground">Onboarding Wizard</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push("/client")}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step indicator */}
                  <button
                    className={cn(
                      "flex flex-col items-center gap-2 group",
                      currentStep >= step.id ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                    disabled={currentStep < step.id}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </button>

                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 mb-8">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          currentStep > step.id ? "bg-primary" : "bg-muted"
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-border/50 mb-8">
          <CardContent className="p-6 md:p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep} of {STEPS.length}
            </Badge>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === STEPS.length ? (
              <>
                Complete Setup
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
