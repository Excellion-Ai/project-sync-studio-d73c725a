import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Flame,
  Play,
  Download,
  UserCircle,
  Upload,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CourseSettings {
  price: number;
  currency: string;
  customDomain: string;
  seoTitle: string;
  seoDescription: string;
  enrollmentOpen: boolean;
  maxStudents: number | null;
  thumbnail: string;
  instructorName: string;
  instructorBio: string;
  offerType: string;
}

interface CourseSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CourseSettings;
  onUpdateSettings: (settings: CourseSettings) => void;
  courseId?: string | null;
  userId?: string;
}

const OFFER_TYPES = [
  { value: "standard", label: "Full Course", desc: "Standard curriculum with modules and lessons", icon: BookOpen },
  { value: "challenge", label: "Challenge", desc: "Day-by-day challenge format", icon: Flame },
  { value: "webinar", label: "Webinar", desc: "Single video with registration", icon: Play },
  { value: "lead_magnet", label: "Lead Magnet", desc: "Free download with email capture", icon: Download },
  { value: "coach_portfolio", label: "Coach Portfolio", desc: "Coach profile with services", icon: UserCircle },
] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

const CourseSettingsDialog = ({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  courseId,
  userId,
}: CourseSettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState<CourseSettings>(settings);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setLocalSettings(settings);
  }, [open, settings]);

  const update = <K extends keyof CourseSettings>(key: K, val: CourseSettings[K]) =>
    setLocalSettings((prev) => ({ ...prev, [key]: val }));

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId || !userId) return;

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${userId}/${courseId}/thumbnail.${ext}`;

    setIsUploadingThumbnail(true);
    const { error } = await supabase.storage
      .from("course-thumbnails")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("Failed to upload thumbnail");
      setIsUploadingThumbnail(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(path);

    update("thumbnail", urlData.publicUrl);
    setIsUploadingThumbnail(false);
    toast.success("Thumbnail uploaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Course Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="type" className="mt-2">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="instructor">Instructor</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          </TabsList>

          {/* ── Type ── */}
          <TabsContent value="type" className="space-y-3 mt-4">
            {OFFER_TYPES.map(({ value, label, desc, icon: Icon }) => (
              <Card
                key={value}
                onClick={() => update("offerType", value)}
                className={cn(
                  "p-3 cursor-pointer flex items-start gap-3 transition-colors",
                  localSettings.offerType === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* ── Pricing ── */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            {/* Thumbnail */}
            <div className="space-y-2">
              <Label className="text-foreground">Thumbnail</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
              {localSettings.thumbnail ? (
                <div className="relative group">
                  <img
                    src={localSettings.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover rounded-md border border-border"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploadingThumbnail}
                  >
                    <Upload className="h-3 w-3 mr-1" /> Replace
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploadingThumbnail || !courseId}
                  className="w-full h-32 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors"
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">
                    {isUploadingThumbnail ? "Uploading…" : "Click to upload"}
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Price</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={localSettings.price}
                onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Currency</Label>
              <Select
                value={localSettings.currency}
                onValueChange={(v) => update("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* ── Instructor ── */}
          <TabsContent value="instructor" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input
                value={localSettings.instructorName}
                onChange={(e) => update("instructorName", e.target.value)}
                placeholder="Instructor name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Bio</Label>
              <Textarea
                value={localSettings.instructorBio}
                onChange={(e) => update("instructorBio", e.target.value)}
                placeholder="Brief instructor bio…"
                rows={4}
              />
            </div>
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-foreground">SEO Title</Label>
                <span className="text-xs text-muted-foreground">
                  {localSettings.seoTitle.length}/60
                </span>
              </div>
              <Input
                value={localSettings.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
                placeholder="Page title for search engines"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-foreground">Meta Description</Label>
                <span className="text-xs text-muted-foreground">
                  {localSettings.seoDescription.length}/160
                </span>
              </div>
              <Textarea
                value={localSettings.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                placeholder="Brief description for search results"
                maxLength={160}
                rows={3}
              />
            </div>
          </TabsContent>

          {/* ── Enrollment ── */}
          <TabsContent value="enrollment" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Open Enrollment</Label>
              <Switch
                checked={localSettings.enrollmentOpen}
                onCheckedChange={(v) => update("enrollmentOpen", v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Max Students</Label>
              <Input
                type="number"
                min={0}
                value={localSettings.maxStudents ?? ""}
                onChange={(e) =>
                  update("maxStudents", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Unlimited"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onUpdateSettings(localSettings);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseSettingsDialog;
