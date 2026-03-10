import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Copy, Check, ExternalLink } from "lucide-react";

interface CoursePublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseUrl: string;
  courseTitle: string;
}

const CoursePublishDialog = ({
  open,
  onOpenChange,
  courseUrl,
  courseTitle,
}: CoursePublishDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(courseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <PartyPopper className="h-12 w-12 text-primary" />
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">
              Your course is live!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{courseTitle}</p>

          <div className="w-full flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <span className="flex-1 text-sm text-foreground truncate text-left">
              {courseUrl}
            </span>
            <Button size="icon" variant="ghost" className="shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              className="flex-1"
              onClick={() => window.open(courseUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> View Live Page
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePublishDialog;
