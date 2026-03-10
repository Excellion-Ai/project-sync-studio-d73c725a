import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RefineChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefine: (prompt: string) => Promise<void>;
  isRefining: boolean;
}

const SUGGESTIONS = [
  "Make week 2 more advanced",
  "Add a quiz to module 3",
  "Rewrite the course description",
  "Add more practical exercises",
  "Include downloadable resources",
  "Make lessons shorter and more focused",
];

const RefineChat = ({ open, onOpenChange, onRefine, isRefining }: RefineChatProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    try {
      await onRefine(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Changes applied!" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRefining) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Refine Your Course
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          {messages.length === 0 ? (
            <div className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Tell the AI how to improve your course
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isRefining && (
                <div className="mr-auto bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm animate-pulse">
                  Refining…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a change…"
            disabled={isRefining}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={isRefining || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RefineChat;
