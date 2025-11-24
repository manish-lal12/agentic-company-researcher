// apps/web/src/app/dashboard/research/new/page.tsx

"use client";

import { ChatInterface } from "@/components/research/ChatInterface";

export default function NewResearchPage() {
  // Show a temporary chat interface that will create a session on first message
  return (
    <div className="h-[calc(100vh-100px)]">
      <ChatInterface sessionId="temp" mode="chat" isNewSession={true} />
    </div>
  );
}
