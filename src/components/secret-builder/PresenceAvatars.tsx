import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface PresenceUser {
  id: string;
  name: string;
  avatarUrl?: string;
  color: string;
}

interface PresenceAvatarsProps {
  users: PresenceUser[];
  maxVisible?: number;
}

const PresenceAvatars = ({ users, maxVisible = 4 }: PresenceAvatarsProps) => {
  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <TooltipProvider>
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <Tooltip key={u.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-background" style={{ borderColor: u.color }}>
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                <AvatarFallback className="text-[10px] bg-muted text-foreground">
                  {u.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{u.name}</p></TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Avatar className="h-7 w-7 border-2 border-background">
            <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">+{overflow}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PresenceAvatars;
