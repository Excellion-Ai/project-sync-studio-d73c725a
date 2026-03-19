import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCircle } from "lucide-react";

interface InstructorSectionProps {
  name: string;
  bio: string;
  avatarUrl?: string;
  onUpdate: (field: "name" | "bio" | "avatarUrl", value: string) => void;
}

const InstructorSection = ({ name, bio, onUpdate }: InstructorSectionProps) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-foreground">
      <UserCircle className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold">Instructor</h3>
    </div>
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground">Name</Label>
        <Input value={name} onChange={(e) => onUpdate("name", e.target.value)} placeholder="Your name" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground">Bio</Label>
        <Textarea value={bio} onChange={(e) => onUpdate("bio", e.target.value)} placeholder="Brief bio…" rows={3} />
      </div>
    </div>
  </div>
);

export default InstructorSection;
