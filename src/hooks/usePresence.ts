import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceUser {
  userId: string;
  name?: string;
  color: string;
  cursor?: { x: number; y: number };
}

const COLORS = [
  "#f43f5e", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#6366f1", "#14b8a6", "#84cc16", "#ef4444",
];

export function usePresence(channelName: string) {
  const { user } = useAuth();
  const [otherUsers, setOtherUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id || !channelName) return;

    const color = COLORS[Math.abs(user.id.charCodeAt(0)) % COLORS.length];

    const ch = supabase.channel(`presence:${channelName}`, {
      config: { presence: { key: user.id } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const presenceState = ch.presenceState<PresenceUser>();
      const users: PresenceUser[] = [];
      for (const [key, entries] of Object.entries(presenceState)) {
        if (key !== user.id && entries.length > 0) {
          users.push(entries[0]);
        }
      }
      setOtherUsers(users);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ userId: user.id, color, cursor: null });
      }
    });

    setChannel(ch);

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, channelName]);

  const updateCursor = useCallback(
    async (cursor: { x: number; y: number }) => {
      if (!channel || !user?.id) return;
      const color = COLORS[Math.abs(user.id.charCodeAt(0)) % COLORS.length];
      await channel.track({ userId: user.id, color, cursor });
    },
    [channel, user?.id]
  );

  return { otherUsers, updateCursor };
}
