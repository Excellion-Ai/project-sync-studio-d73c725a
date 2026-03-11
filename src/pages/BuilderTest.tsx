import { useState } from "react";
import BuilderChat, { type Message, type BuilderState, type SmartDefaults } from "@/components/builder/BuilderChat";
import BuilderPreviewPanel from "@/components/builder/BuilderPreviewPanel";
import BuilderSidebar from "@/components/builder/BuilderSidebar";

const BuilderTest = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<BuilderState>("idle");
  const [inputs, setInputs] = useState<SmartDefaults>({
    businessType: "",
    goal: "leads",
    style: "modern",
    ctaText: "",
    referenceUrl: "",
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const [projectName, setProjectName] = useState("Test Project");

  const handleSendMessage = (msg: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setState("loading");
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `**Got it!** Here's what I'll build:\n- A ${inputs.businessType || "business"} website\n- Goal: ${inputs.goal}\n- Style: ${inputs.style}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
      setGeneratedCode("<div class='p-8 text-center'><h1>Generated Preview</h1></div>");
      setState("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border">
        <BuilderSidebar
          projectName={projectName}
          onProjectNameChange={setProjectName}
          state={state}
          onNewProject={() => {
            setMessages([]);
            setState("idle");
            setGeneratedCode("");
          }}
          history={[
            { id: "1", name: "My First Site", updatedAt: "2026-03-10" },
            { id: "2", name: "Portfolio v2", updatedAt: "2026-03-09" },
          ]}
          onSelectHistory={(id) => console.log("Selected project:", id)}
        />
      </div>

      {/* Chat */}
      <div className="w-96 border-r border-border">
        <BuilderChat
          messages={messages}
          state={state}
          isLoading={state === "loading"}
          inputs={inputs}
          onInputsChange={setInputs}
          onSendMessage={handleSendMessage}
          onQuickAction={(action) => handleSendMessage(action)}
        />
      </div>

      {/* Preview */}
      <div className="flex-1">
        <BuilderPreviewPanel
          generatedCode={generatedCode}
          isLoading={state === "loading"}
          error={state === "error" ? "Something went wrong" : undefined}
          onRefresh={() => console.log("Refresh")}
          onExport={() => console.log("Export")}
          onBuildFromBrief={() => handleSendMessage("Build from brief")}
        />
      </div>
    </div>
  );
};

export default BuilderTest;
