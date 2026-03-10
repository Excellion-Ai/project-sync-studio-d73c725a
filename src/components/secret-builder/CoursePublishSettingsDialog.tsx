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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Globe,
  Search,
  Share2,
  Upload,
  ImageIcon,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PublishSettings {
  seoTitle: string;
  seoDescription: string;
  status: string;
  socialImageUrl: string;
}

interface DomainRecord {
  id: string;
  domain: string;
  verified: boolean;
}

interface CoursePublishSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  courseTitle: string;
  courseSubdomain: string;
  onStatusChange?: (status: string) => void;
}

const CoursePublishSettingsDialog = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  courseSubdomain,
  onStatusChange,
}: CoursePublishSettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<PublishSettings>({
    seoTitle: "",
    seoDescription: "",
    status: "draft",
    socialImageUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [domainRecord, setDomainRecord] = useState<DomainRecord | null>(null);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [isRemovingDomain, setIsRemovingDomain] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const courseUrl = `https://${courseSubdomain}.excellion.com`;

  useEffect(() => {
    if (open && courseId) loadSettings();
  }, [open, courseId]);

  const loadSettings = async () => {
    if (!courseId) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("courses")
      .select("status, seo_title, seo_description, custom_domain, social_image_url, subdomain")
      .eq("id", courseId)
      .single();

    if (!error && data) {
      setSettings({
        seoTitle: data.seo_title ?? "",
        seoDescription: data.seo_description ?? "",
        status: data.status ?? "draft",
        socialImageUrl: data.social_image_url ?? "",
      });

      if (data.custom_domain) {
        setDomainRecord({ id: courseId, domain: data.custom_domain, verified: true });
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!courseId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("courses")
      .update({
        status: settings.status,
        seo_title: settings.seoTitle,
        seo_description: settings.seoDescription,
        social_image_url: settings.socialImageUrl,
        published_at: settings.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", courseId);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
      onStatusChange?.(settings.status);
      onOpenChange(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(courseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadSocialImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !courseId) return;

    const ext = file.name.split(".").pop() ?? "png";
    const path = `social/${courseId}/og-image.${ext}`;

    setIsUploadingImage(true);
    const { error } = await supabase.storage
      .from("course-thumbnails")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("Failed to upload image");
      setIsUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(path);

    setSettings((prev) => ({ ...prev, socialImageUrl: urlData.publicUrl }));
    setIsUploadingImage(false);
    toast.success("Image uploaded");
  };

  const handleAddDomain = async () => {
    if (!newDomainInput.trim() || !courseId) return;
    setIsAddingDomain(true);

    const { error } = await supabase
      .from("courses")
      .update({ custom_domain: newDomainInput.trim(), updated_at: new Date().toISOString() } as any)
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to add domain");
    } else {
      setDomainRecord({ id: courseId, domain: newDomainInput.trim(), verified: false });
      setNewDomainInput("");
      toast.success("Domain added — configure DNS records below");
    }
    setIsAddingDomain(false);
  };

  const handleVerifyDomain = async () => {
    if (!domainRecord || !courseId) return;
    setIsVerifyingDomain(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-domain-dns", {
        body: { domain: domainRecord.domain, courseId },
      });

      if (error) throw error;
      if (data?.verified) {
        setDomainRecord((prev) => prev ? { ...prev, verified: true } : null);
        toast.success("Domain verified!");
      } else {
        toast.error("DNS records not found yet. Please wait and try again.");
      }
    } catch {
      toast.error("Verification failed");
    }
    setIsVerifyingDomain(false);
  };

  const handleRemoveDomain = async () => {
    if (!courseId) return;
    setIsRemovingDomain(true);

    const { error } = await supabase
      .from("courses")
      .update({ custom_domain: null, domain_verified: false, updated_at: new Date().toISOString() } as any)
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to remove domain");
    } else {
      setDomainRecord(null);
      toast.success("Domain removed");
    }
    setIsRemovingDomain(false);
  };

  const isPublished = settings.status === "published";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Publish Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="general"><Globe className="h-3.5 w-3.5 mr-1" />General</TabsTrigger>
              <TabsTrigger value="seo"><Search className="h-3.5 w-3.5 mr-1" />SEO</TabsTrigger>
              <TabsTrigger value="domain"><Globe className="h-3.5 w-3.5 mr-1" />Domain</TabsTrigger>
              <TabsTrigger value="social"><Share2 className="h-3.5 w-3.5 mr-1" />Social</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground">Course URL</Label>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <span className="flex-1 text-sm text-foreground truncate">{courseUrl}</span>
                  <Button size="icon" variant="ghost" className="shrink-0" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">Publication Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublished ? "Course is live" : "Course is in draft mode"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        status: checked ? "published" : "draft",
                      }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-foreground">SEO Title</Label>
                  <span className="text-xs text-muted-foreground">{settings.seoTitle.length}/60</span>
                </div>
                <Input
                  value={settings.seoTitle}
                  onChange={(e) => setSettings((p) => ({ ...p, seoTitle: e.target.value }))}
                  placeholder={courseTitle}
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-foreground">Meta Description</Label>
                  <span className="text-xs text-muted-foreground">{settings.seoDescription.length}/160</span>
                </div>
                <Textarea
                  value={settings.seoDescription}
                  onChange={(e) => setSettings((p) => ({ ...p, seoDescription: e.target.value }))}
                  placeholder="Brief description for search results"
                  maxLength={160}
                  rows={3}
                />
              </div>

              {/* Google preview */}
              <Card className="border-border/50">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Search preview</p>
                  <p className="text-sm text-blue-400 truncate">
                    {settings.seoTitle || courseTitle}
                  </p>
                  <p className="text-xs text-emerald-500 truncate">{courseUrl}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {settings.seoDescription || "No description set"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domain */}
            <TabsContent value="domain" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-foreground">Default URL</Label>
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground truncate">
                  {courseUrl}
                </div>
              </div>

              {!domainRecord ? (
                <div className="space-y-2">
                  <Label className="text-foreground">Custom Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      placeholder="mycourse.com"
                    />
                    <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomainInput.trim()}>
                      {isAddingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{domainRecord.domain}</p>
                      <Badge variant={domainRecord.verified ? "default" : "secondary"} className="mt-1">
                        {domainRecord.verified ? "Verified" : "Pending verification"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {!domainRecord.verified && (
                        <Button size="sm" variant="outline" onClick={handleVerifyDomain} disabled={isVerifyingDomain}>
                          {isVerifyingDomain ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          <span className="ml-1">Verify</span>
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={handleRemoveDomain} disabled={isRemovingDomain}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {!domainRecord.verified && (
                    <Card className="border-border/50">
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-2">Add these DNS records at your registrar:</p>
                        <div className="text-xs space-y-1 font-mono">
                          <div className="grid grid-cols-3 gap-2 text-muted-foreground font-sans font-medium border-b border-border pb-1">
                            <span>Type</span><span>Name</span><span>Value</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-foreground">
                            <span>A</span><span>@</span><span>185.158.133.1</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-foreground">
                            <span>A</span><span>www</span><span>185.158.133.1</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-foreground">
                            <span>TXT</span><span>_verify</span><span>excellion={courseId?.slice(0, 8)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Social */}
            <TabsContent value="social" className="space-y-4 mt-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadSocialImage}
              />

              <div className="space-y-2">
                <Label className="text-foreground">OG Image</Label>
                {settings.socialImageUrl ? (
                  <div className="relative group">
                    <img
                      src={settings.socialImageUrl}
                      alt="Social preview"
                      className="w-full h-40 object-cover rounded-md border border-border"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Replace
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full h-40 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">{isUploadingImage ? "Uploading…" : "Upload OG image (1200×630)"}</span>
                  </button>
                )}
              </div>

              {/* Social card preview */}
              <Card className="border-border/50 overflow-hidden">
                <div className="bg-muted/30 h-28 flex items-center justify-center">
                  {settings.socialImageUrl ? (
                    <img src={settings.socialImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground truncate">{courseUrl}</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {settings.seoTitle || courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {settings.seoDescription || "No description"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save & Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePublishSettingsDialog;
