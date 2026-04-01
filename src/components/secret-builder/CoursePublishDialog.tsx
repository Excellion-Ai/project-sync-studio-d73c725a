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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden border-border bg-card p-0 text-center text-card-foreground shadow-lg sm:rounded-lg">
        <DialogDescription className="sr-only">
          Your course has been published successfully.
        </DialogDescription>
        <div className="flex w-full flex-col items-center gap-4 px-6 pb-6 pt-10">
          <PartyPopper className="h-12 w-12 text-primary" />
          <DialogHeader className="w-full items-center text-center">
            <DialogTitle className="text-2xl text-card-foreground">
              Your course is live!
            </DialogTitle>
          </DialogHeader>
          <p className="w-full max-w-[28rem] break-words text-sm leading-relaxed text-muted-foreground">
            {courseTitle}
          </p>

          <div className="flex w-full flex-col items-center gap-3 rounded-md border border-border bg-secondary/40 px-4 py-3 text-center">
            <span className="w-full break-all text-xs leading-relaxed text-card-foreground">
              {courseUrl}
            </span>
            <Button size="sm" variant="ghost" className="h-9 gap-2 px-3" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </Button>
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
            <Button
              className="w-full sm:flex-1"
              onClick={() => window.open(courseUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>View Live Page</span>
            </Button>
            <Button variant="outline" className="w-full sm:flex-1" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePublishDialog;
