import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
      <DialogContent className="w-[calc(100vw-3rem)] max-w-sm overflow-hidden border-border bg-card p-0 text-center text-card-foreground shadow-lg sm:rounded-lg">
        <DialogDescription className="sr-only">
          Your course has been published successfully.
        </DialogDescription>
        <div className="flex w-full flex-col items-center gap-4 px-5 pb-6 pt-10">
          <PartyPopper className="h-12 w-12 text-primary" />
          <DialogHeader className="w-full items-center text-center">
            <DialogTitle className="text-2xl text-card-foreground">
              Your course is live!
            </DialogTitle>
          </DialogHeader>
          <p className="w-full text-sm text-muted-foreground truncate">{courseTitle}</p>

          <div className="flex w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 overflow-hidden">
            <span className="flex-1 truncate text-left text-xs text-card-foreground">
              {courseUrl}
            </span>
            <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex w-full gap-3">
            <Button
              className="flex-1 min-w-0"
              onClick={() => window.open(courseUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1 shrink-0" />
              <span className="truncate">View Live Page</span>
            </Button>
            <Button variant="outline" className="flex-1 min-w-0" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePublishDialog;
