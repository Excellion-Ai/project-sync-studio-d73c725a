import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wand2,
  MessageSquare,
  Send,
  Paperclip,
  Sparkles,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedCourse } from "@/types/course-pages";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AttachmentPreview {
  id: string;
  name: string;
  type: string;
  url?: string;
  content?: string;
}

interface CourseCommandPanelProps {
  courseId: string;
  course: ExtendedCourse;
  onApplyChanges: (changes: Record<string, any>) => void;
}

const CourseCommandPanel = ({
  courseId,
  course,
  onApplyChanges,
}: CourseCommandPanelProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"build" | "chat">("build");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history
  useEffect(() => {
    if (!courseId || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("course_chat_history")
        .select("id, role, content, created_at")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    })();
  }, [courseId, user?.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!user?.id || !courseId) return;
      await supabase.from("course_chat_history").insert({
        course_id: courseId,
        user_id: user.id,
        role,
        content,
      });
    },
    [courseId, user?.id]
  );

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setIsLoading(true);
    await saveMessage("user", text);

    try {
      if (mode === "build") {
        // Include attachment content in the command
        const attachmentText = attachments
          .filter((a) => a.content)
          .map((a) => `[Attached: ${a.name}]\n${a.content}`)
          .join("\n\n");
        const fullCommand = attachmentText
          ? `${text}\n\nReference material:\n${attachmentText}`
          : text;

        const { data, error } = await supabase.functions.invoke(
          "interpret-course-command",
          {
            body: {
              command: fullCommand,
              currentCourse: {
                title: course.title,
                modules: course.modules,
                layout_style: course.layout_style,
                section_order: course.section_order,
              },
              currentDesign: course.design_config,
            },
          }
        );
        if (error) throw error;

        const reply = data?.explanation || "Changes applied.";
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        await saveMessage("assistant", reply);

        if (data?.changes) {
          onApplyChanges(data);
        }
      } else {
        const { data, error } = await supabase.functions.invoke("help-chat", {
          body: {
            messages: [
              ...messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: text },
            ],
          },
        });
        if (error) throw error;

        const reply = data?.reply || "I couldn't generate a response.";
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        await saveMessage("assistant", reply);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setAttachments((prev) => [...prev, {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        content: content.slice(0, 12000),
      }]);
    } catch {
      setAttachments((prev) => [...prev, {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
      }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const BUILD_SUGGESTIONS = [
    "Make the hero section centered with a gradient background",
    "Change the color scheme to deep blue and gold",
    "Add a guarantee section after testimonials",
    "Use a serif font for headings",
  ];

  const CHAT_SUGGESTIONS = [
    "How should I price my course?",
    "What makes a good course landing page?",
    "How do I structure a beginner course?",
  ];

  const suggestions = mode === "build" ? BUILD_SUGGESTIONS : CHAT_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full">
      {/* Mode tabs */}
      <div className="px-3 pt-3 pb-2">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "build" | "chat")}
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="build" className="gap-1.5 text-xs">
              <Wand2 className="w-3.5 h-3.5" />
              Design
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3">
        {messages.length === 0 ? (
          <div className="space-y-2 py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
              <Sparkles className="w-4 h-4" />
              {mode === "build" ? "Design commands" : "Ask anything"}
            </div>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="w-full text-left text-xs px-3 py-2 rounded-md border border-border/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "text-xs rounded-lg px-3 py-2 max-w-[90%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {mode === "build" ? "Interpreting…" : "Thinking…"}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 pb-1 flex gap-2 flex-wrap">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1"
            >
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{a.name}</span>
              <button onClick={() => removeAttachment(a.id)}>
                <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area — flush bottom */}
      <div className="border-t border-border p-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
        <div className="flex items-end justify-between gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "build"
                ? "Describe a design change…"
                : "Ask a question…"
            }
            rows={2}
            className="resize-none text-sm flex-1"
            disabled={isLoading}
          />
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!prompt.trim() || isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCommandPanel;
