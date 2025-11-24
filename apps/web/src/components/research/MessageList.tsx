import { useEffect, useRef } from "react";
import { Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: string;
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isInitializing?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  isInitializing = false,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="p-4 space-y-4 bg-background">
      {messages.length === 0 && !isInitializing ? (
        <div></div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-muted text-foreground border border-border rounded-bl-none"
                }`}
              >
                <div className="text-sm wrap-break-word">
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }: any) => (
                            <h1
                              className="text-lg font-bold mt-3 mb-2 wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          h2: ({ ...props }: any) => (
                            <h2
                              className="text-base font-bold mt-2 mb-1.5 wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          h3: ({ ...props }: any) => (
                            <h3
                              className="text-sm font-bold mt-2 mb-1 wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          p: ({ ...props }: any) => (
                            <p
                              className="mb-2 text-sm leading-relaxed wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          ul: ({ ...props }: any) => (
                            <ul
                              className="list-disc list-inside mb-2 space-y-1 text-sm text-foreground"
                              {...props}
                            />
                          ),
                          ol: ({ ...props }: any) => (
                            <ol
                              className="list-decimal list-inside mb-2 space-y-1 text-sm text-foreground"
                              {...props}
                            />
                          ),
                          li: ({ ...props }: any) => (
                            <li
                              className="ml-1 wrap-break-word text-sm text-foreground"
                              {...props}
                            />
                          ),
                          blockquote: ({ ...props }: any) => (
                            <blockquote
                              className="border-l-4 border-blue-500 pl-3 italic my-2 text-muted-foreground text-sm"
                              {...props}
                            />
                          ),
                          code: ({ node, inline, ...props }: any) =>
                            inline ? (
                              <code
                                className="bg-muted px-1.5 rounded font-mono text-xs wrap-break-word text-foreground"
                                {...props}
                              />
                            ) : (
                              <code
                                className="bg-muted p-2 rounded block font-mono text-xs overflow-x-auto my-1 text-foreground"
                                {...props}
                              />
                            ),
                          strong: ({ ...props }: any) => (
                            <strong
                              className="font-bold wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          em: ({ ...props }: any) => (
                            <em
                              className="italic wrap-break-word text-foreground"
                              {...props}
                            />
                          ),
                          table: ({ ...props }: any) => (
                            <div className="overflow-x-auto my-2">
                              <table
                                className="w-full border-collapse border border-border text-sm"
                                {...props}
                              />
                            </div>
                          ),
                          thead: ({ ...props }: any) => (
                            <thead className="bg-muted" {...props} />
                          ),
                          th: ({ ...props }: any) => (
                            <th
                              className="border border-border p-2 font-bold text-left text-xs text-foreground"
                              {...props}
                            />
                          ),
                          td: ({ ...props }: any) => (
                            <td
                              className="border border-border p-2 text-xs text-foreground"
                              {...props}
                            />
                          ),
                          a: ({ ...props }: any) => (
                            <a
                              className="text-blue-600 hover:underline wrap-break-word"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{message.content}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground border border-border rounded-lg rounded-bl-none px-4 py-2 flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </>
      )}
    </div>
  );
}
