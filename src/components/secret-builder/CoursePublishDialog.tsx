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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden border-border bg-card p-0 text-center text-card-foreground shadow-lg sm:rounded-lg">
        <DialogDescription className="sr-only">
          Your course has been published successfully.
        </DialogDescription>
        <div className="flex w-full flex-col items-center gap-4 px-6 pb-6 pt-10">
          <PartyPopper className="h-12 w-12 text-primary" />
          <DialogHeader className="w-full items-center text-center">
            <DialogTitle className="text-safe text-2xl text-card-foreground">
              Your course is live!
            </DialogTitle>
          </DialogHeader>
          <p className="text-safe w-full text-sm text-muted-foreground">{courseTitle}</p>

          <div className="flex w-full max-w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-left text-sm text-card-foreground">
              {courseUrl}
            </span>
            <Button size="icon" variant="ghost" className="shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              className="min-w-0 w-full"
              onClick={() => window.open(courseUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> View Live Page
            </Button>
            <Button variant="outline" className="min-w-0 w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePublishDialog;
