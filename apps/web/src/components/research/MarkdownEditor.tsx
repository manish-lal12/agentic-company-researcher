"use client";

import { useState, useRef } from "react";
import { FileText, Copy, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import dynamic from "next/dynamic";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  companyName?: string;
  planName?: string;
}

export function MarkdownEditor({
  initialContent = "",
  onSave,
  readOnly = false,
  companyName,
  planName,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave(content);
      toast.success("Plan saved successfully");
    } catch (error) {
      toast.error("Failed to save plan");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${planName || "plan"}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded");
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;

    try {
      const toastId = toast.loading("Generating PDF...");

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `${planName || "plan"}-${new Date().toISOString().split("T")[0]}.pdf`
      );

      toast.success("PDF exported successfully");
      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    }
  };

  const markdownComponents = {
    h1: (props: any) => (
      <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900" {...props} />
    ),
    h2: (props: any) => (
      <h2
        className="text-xl font-semibold mt-5 mb-2 text-gray-800"
        {...props}
      />
    ),
    h3: (props: any) => (
      <h3
        className="text-lg font-semibold mt-4 mb-2 text-gray-700"
        {...props}
      />
    ),
    p: (props: any) => (
      <p className="mb-3 text-sm leading-relaxed text-gray-700" {...props} />
    ),
    ul: (props: any) => (
      <ul
        className="list-disc ml-6 mb-3 text-sm space-y-1 text-gray-700"
        {...props}
      />
    ),
    ol: (props: any) => (
      <ol
        className="list-decimal ml-6 mb-3 text-sm space-y-1 text-gray-700"
        {...props}
      />
    ),
    li: (props: any) => <li className="text-sm text-gray-700" {...props} />,
    blockquote: (props: any) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 italic text-sm text-gray-600 my-3"
        {...props}
      />
    ),
    code: ({ inline, ...props }: any) =>
      inline ? (
        <code
          className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800"
          {...props}
        />
      ) : (
        <code
          className="block bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto"
          {...props}
        />
      ),
    table: (props: any) => (
      <table
        className="w-full border-collapse rounded overflow-hidden my-3 text-sm"
        {...props}
      />
    ),
    th: (props: any) => (
      <th
        className="border bg-gray-200 p-2 font-semibold text-left text-gray-900"
        {...props}
      />
    ),
    td: (props: any) => <td className="border p-2 text-gray-700" {...props} />,
    a: (props: any) => (
      <a
        className="text-blue-600 hover:underline break-all text-sm"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gray-50 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">
            {planName ? `${planName}` : "Account Plan"}
            {companyName && (
              <span className="text-gray-600 ml-2">— {companyName}</span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Copy content"
          >
            <Copy size={16} className="text-gray-600" />
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Download Markdown"
          >
            <FileText size={16} className="text-gray-600" />
          </button>

          <button
            onClick={handleExportPDF}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Export PDF"
          >
            <Download size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {readOnly ? (
          <div
            ref={previewRef}
            className="h-full overflow-y-auto p-4 prose prose-sm max-w-none"
          >
            {content ? (
              <ReactMarkdown components={markdownComponents}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">No content available</p>
            )}
          </div>
        ) : (
          <div data-color-mode="light" className="h-full">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || "")}
              height={600}
              preview="live"
              hideToolbar={false}
              visibleDragbar={true}
              className="h-full"
              textareaProps={{
                disabled: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
