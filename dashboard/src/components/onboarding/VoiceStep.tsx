"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Globe,
  User,
  Briefcase,
  Heart,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export type VoiceLanguage = "fr" | "en" | "ar" | "es" | "darija";
export type VoicePersona = "professional" | "friendly" | "enthusiastic" | "calm";

interface LanguageOption {
  id: VoiceLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

interface PersonaOption {
  id: VoicePersona;
  name: string;
  description: string;
  icon: typeof User;
}

const LANGUAGES: LanguageOption[] = [
  { id: "fr", name: "French", nativeName: "Francais", flag: "🇫🇷" },
  { id: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { id: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { id: "es", name: "Spanish", nativeName: "Espanol", flag: "🇪🇸" },
  { id: "darija", name: "Moroccan Arabic", nativeName: "الدارجة", flag: "🇲🇦" },
];

const PERSONAS: PersonaOption[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Formal and business-oriented tone",
    icon: Briefcase,
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm and approachable conversation",
    icon: Heart,
  },
  {
    id: "enthusiastic",
    name: "Enthusiastic",
    description: "Energetic and engaging style",
    icon: Sparkles,
  },
  {
    id: "calm",
    name: "Calm",
    description: "Soothing and reassuring voice",
    icon: User,
  },
];

interface VoiceConfig {
  language: VoiceLanguage;
  persona: VoicePersona;
}

interface VoiceStepProps {
  config: VoiceConfig;
  onChange: (config: VoiceConfig) => void;
}

export function VoiceStep({ config, onChange }: VoiceStepProps) {
  const selectedLanguage = LANGUAGES.find((l) => l.id === config.language);
  const selectedPersona = PERSONAS.find((p) => p.id === config.persona);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Voice AI Configuration</h2>
        <p className="text-muted-foreground">
          Customize your voice assistant&apos;s language and personality
        </p>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Language</h3>
        </div>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
          {LANGUAGES.map((lang) => {
            const isSelected = config.language === lang.id;

            return (
              <Card
                key={lang.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/50"
                )}
                onClick={() => onChange({ ...config, language: lang.id })}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{lang.flag}</div>
                  <p className="font-medium text-sm">{lang.name}</p>
                  <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-primary mx-auto mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Persona Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Persona</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {PERSONAS.map((persona) => {
            const isSelected = config.persona === persona.id;
            const Icon = persona.icon;

            return (
              <Card
                key={persona.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border/50"
                )}
                onClick={() => onChange({ ...config, persona: persona.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-primary/20" : "bg-muted/50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {persona.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Configuration Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl">{selectedLanguage?.flag}</div>
            <div>
              <p className="font-medium">
                {selectedPersona?.name} voice in {selectedLanguage?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPersona?.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
