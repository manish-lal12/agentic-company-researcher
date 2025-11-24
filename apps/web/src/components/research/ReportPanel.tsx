import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { X, Download, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ReportPanelProps {
  title: string;
  content: string;
  isVisible: boolean;
  onClose: () => void;
  sessionId: string;
}

interface ReportSection {
  title: string;
  content: string;
  expanded: boolean;
}

export function ReportPanel({
  title,
  content,
  isVisible,
  onClose,
  sessionId,
}: ReportPanelProps) {
  const [sections, setSections] = useState<ReportSection[]>([
    { title: "Report", content, expanded: true },
  ]);

  if (!isVisible) return null;

  const handleExport = () => {
    const text = content;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute(
      "download",
      `report-${sessionId}-${new Date().toISOString().split("T")[0]}.txt`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Report exported");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Report copied to clipboard");
  };

  const toggleSection = (index: number) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center bg-muted/40">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-muted rounded transition-colors"
              title="Copy to clipboard"
            >
              <Copy size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-muted rounded transition-colors"
              title="Export report"
            >
              <Download size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden bg-background"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors bg-muted/30"
                >
                  <h3 className="font-semibold text-lg text-foreground">
                    {section.title}
                  </h3>
                  {section.expanded ? (
                    <ChevronUp size={18} className="text-foreground" />
                  ) : (
                    <ChevronDown size={18} className="text-foreground" />
                  )}
                </button>

                {section.expanded && (
                  <div className="p-4 prose prose-sm max-w-none dark:prose-invert text-foreground">
                    <ReactMarkdown
                      components={{
                        h1: ({ ...props }: any) => (
                          <h1
                            className="text-2xl font-bold mt-4 mb-2"
                            {...props}
                          />
                        ),
                        h2: ({ ...props }: any) => (
                          <h2
                            className="text-xl font-bold mt-3 mb-2"
                            {...props}
                          />
                        ),
                        h3: ({ ...props }: any) => (
                          <h3
                            className="text-lg font-bold mt-2 mb-1"
                            {...props}
                          />
                        ),
                        p: ({ ...props }: any) => (
                          <p className="mb-2 leading-relaxed" {...props} />
                        ),
                        ul: ({ ...props }: any) => (
                          <ul
                            className="list-disc list-inside mb-2 space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ ...props }: any) => (
                          <ol
                            className="list-decimal list-inside mb-2 space-y-1"
                            {...props}
                          />
                        ),
                        li: ({ ...props }: any) => (
                          <li className="ml-2" {...props} />
                        ),
                        blockquote: ({ ...props }: any) => (
                          <blockquote
                            className="border-l-4 border-blue-500 pl-4 italic my-2 text-muted-foreground"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="bg-muted px-1 rounded font-mono text-sm text-foreground"
                              {...props}
                            />
                          ) : (
                            <code
                              className="bg-muted p-2 rounded block font-mono text-sm overflow-x-auto text-foreground"
                              {...props}
                            />
                          ),
                        strong: ({ ...props }: any) => (
                          <strong className="font-bold" {...props} />
                        ),
                        em: ({ ...props }: any) => (
                          <em className="italic" {...props} />
                        ),
                        table: ({ ...props }: any) => (
                          <table
                            className="w-full border-collapse my-2"
                            {...props}
                          />
                        ),
                        th: ({ ...props }: any) => (
                          <th
                            className="border border-border p-2 bg-muted font-bold text-left"
                            {...props}
                          />
                        ),
                        td: ({ ...props }: any) => (
                          <td className="border border-border p-2" {...props} />
                        ),
                        a: ({ ...props }: any) => (
                          <a
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/30 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
