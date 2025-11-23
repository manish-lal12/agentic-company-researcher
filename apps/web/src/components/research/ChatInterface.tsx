// apps/web/src/components/research/ChatInterface.tsx

import { useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { FindingsList } from "./FindingsList";
import { trpc } from "@/lib/trpc";

interface ChatInterfaceProps {
  sessionId: string;
  mode: "chat" | "voice";
}

export function ChatInterface({ sessionId, mode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<
    Array<{ id: string; role: string; content: string }>
  >([]);
  const [findings, setFindings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call tRPC mutation to send message to AI agent
      const response = await trpc.agent.askQuestion.mutate({
        sessionId,
        question: content,
      });
      // Add AI response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          typeof response === "string" ? response : JSON.stringify(response),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportFindings = () => {
    // Export findings as JSON
    const dataStr = JSON.stringify(findings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `findings-${sessionId}-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4">
      {/* Main Chat Area */}
      <div className="flex flex-col bg-white rounded-lg border overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          mode={mode}
          sessionId={sessionId}
        />
      </div>

      {/* Right Sidebar */}
      <div className="space-y-4 overflow-y-auto">
        <FindingsList findings={findings} sessionId={sessionId} />
      </div>
    </div>
  );
}
