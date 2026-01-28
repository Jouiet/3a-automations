"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Code,
  Globe,
  Smartphone,
  ExternalLink,
  Play,
} from "lucide-react";

interface EmbedStepProps {
  tenantId: string;
  widgetUrl?: string;
}

export function EmbedStep({ tenantId, widgetUrl }: EmbedStepProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://dashboard.3a-automation.com";
  const actualWidgetUrl = widgetUrl || `${baseUrl}/widget/${tenantId}`;

  const snippets = {
    script: `<!-- 3A Automation Voice Widget -->
<script src="${actualWidgetUrl}/voice-widget.js" async></script>
<script>
  window.AAA = window.AAA || {};
  AAA.tenantId = "${tenantId}";
  AAA.position = "bottom-right";
</script>`,

    iframe: `<iframe
  src="${actualWidgetUrl}/embed"
  style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border: none; z-index: 9999;"
  title="3A Voice Assistant"
  allow="microphone"
></iframe>`,

    react: `import { VoiceWidget } from "@3a-automation/react";

function App() {
  return (
    <VoiceWidget
      tenantId="${tenantId}"
      position="bottom-right"
    />
  );
}`,

    shopify: `<!-- Add to theme.liquid before </body> -->
<script src="${actualWidgetUrl}/voice-widget.js" async></script>
<script>
  window.AAA = window.AAA || {};
  AAA.tenantId = "{{ shop.permanent_domain | handle }}";
  AAA.customerEmail = "{{ customer.email }}";
  AAA.position = "bottom-right";
</script>`,
  };

  const handleCopy = async (key: string) => {
    const text = snippets[key as keyof typeof snippets];
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Embed Your Voice Widget</h2>
        <p className="text-muted-foreground">
          Add the voice assistant to your website with a simple code snippet
        </p>
      </div>

      {/* Widget Preview */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Live Preview</CardTitle>
                <CardDescription>Your widget ID: {tenantId}</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`${actualWidgetUrl}/demo`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Test Demo
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden">
            {/* Simulated website background */}
            <div className="absolute inset-0 p-4">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-3 w-48 bg-white/5 rounded" />
                <div className="h-3 w-40 bg-white/5 rounded" />
              </div>
            </div>
            {/* Widget preview */}
            <div className="absolute bottom-4 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Snippets */}
      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="script" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="iframe" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            iFrame
          </TabsTrigger>
          <TabsTrigger value="react" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            React
          </TabsTrigger>
          <TabsTrigger value="shopify" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Shopify
          </TabsTrigger>
        </TabsList>

        {Object.entries(snippets).map(([key, code]) => (
          <TabsContent key={key} value={key}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {key === "script"
                        ? "HTML"
                        : key === "iframe"
                          ? "HTML"
                          : key === "react"
                            ? "JSX"
                            : "Liquid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {key === "script"
                        ? "Recommended for most websites"
                        : key === "iframe"
                          ? "No JavaScript required"
                          : key === "react"
                            ? "For React applications"
                            : "For Shopify themes"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(key)}
                    className={cn(
                      "transition-colors",
                      copied === key && "text-green-400"
                    )}
                  >
                    {copied === key ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-slate-950 overflow-x-auto">
                  <code className="text-sm text-slate-300 whitespace-pre">
                    {code}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Installation Instructions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the code snippet for your platform
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              Paste it just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium shrink-0">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              The widget will appear in the bottom-right corner of your site
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
