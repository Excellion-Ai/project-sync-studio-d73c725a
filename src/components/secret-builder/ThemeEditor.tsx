import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Save } from "lucide-react";

export interface DesignConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBackground: string;
    text: string;
    textMuted: string;
  };
  fonts: { heading: string; body: string };
  spacing: "compact" | "normal" | "relaxed";
  borderRadius: "none" | "small" | "medium" | "large";
  heroStyle: "gradient" | "image" | "minimal" | "split";
}

const DEFAULT_CONFIG: DesignConfig = {
  colors: {
    primary: "#d4a853",
    secondary: "#1a1a1a",
    accent: "#f59e0b",
    background: "#0a0a0a",
    cardBackground: "#111111",
    text: "#ffffff",
    textMuted: "#9ca3af",
  },
  fonts: { heading: "Inter", body: "Inter" },
  spacing: "normal",
  borderRadius: "medium",
  heroStyle: "gradient",
};

const FONT_OPTIONS = ["Inter", "DM Sans", "Playfair Display", "Poppins", "Space Grotesk", "Montserrat", "Lora", "Merriweather"];

interface ThemeEditorProps {
  config: Partial<DesignConfig>;
  onUpdate: (config: DesignConfig) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const ThemeEditor = ({ config, onUpdate, onSave, isSaving }: ThemeEditorProps) => {
  const merged: DesignConfig = { ...DEFAULT_CONFIG, ...config, colors: { ...DEFAULT_CONFIG.colors, ...config?.colors }, fonts: { ...DEFAULT_CONFIG.fonts, ...config?.fonts } };

  const updateColor = (key: keyof DesignConfig["colors"], value: string) => {
    onUpdate({ ...merged, colors: { ...merged.colors, [key]: value } });
  };

  const COLOR_FIELDS: { key: keyof DesignConfig["colors"]; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
    { key: "background", label: "Background" },
    { key: "cardBackground", label: "Card BG" },
    { key: "text", label: "Text" },
    { key: "textMuted", label: "Muted Text" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-foreground">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Theme Editor</h3>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <Label className="text-xs text-foreground font-medium">Colors</Label>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={merged.colors[key]}
                onChange={(e) => updateColor(key, e.target.value)}
                className="h-7 w-7 rounded border border-border cursor-pointer shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs text-foreground font-mono">{merged.colors[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="space-y-2">
        <Label className="text-xs text-foreground font-medium">Fonts</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Heading</p>
            <Select value={merged.fonts.heading} onValueChange={(v) => onUpdate({ ...merged, fonts: { ...merged.fonts, heading: v } })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Body</p>
            <Select value={merged.fonts.body} onValueChange={(v) => onUpdate({ ...merged, fonts: { ...merged.fonts, body: v } })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Spacing & Radius */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-foreground">Spacing</Label>
          <Select value={merged.spacing} onValueChange={(v) => onUpdate({ ...merged, spacing: v as DesignConfig["spacing"] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="relaxed">Relaxed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-foreground">Radius</Label>
          <Select value={merged.borderRadius} onValueChange={(v) => onUpdate({ ...merged, borderRadius: v as DesignConfig["borderRadius"] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hero Style */}
      <div className="space-y-1">
        <Label className="text-xs text-foreground">Hero Style</Label>
        <Select value={merged.heroStyle} onValueChange={(v) => onUpdate({ ...merged, heroStyle: v as DesignConfig["heroStyle"] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="split">Split</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {onSave && (
        <Button onClick={onSave} disabled={isSaving} className="w-full gap-1.5">
          <Save className="h-4 w-4" /> {isSaving ? "Saving…" : "Save Theme"}
        </Button>
      )}
    </div>
  );
};

export default ThemeEditor;
