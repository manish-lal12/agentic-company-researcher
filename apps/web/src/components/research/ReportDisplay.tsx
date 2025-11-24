import { Download, Copy, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useCallback, useRef } from "react";

interface ReportDisplayProps {
  content: string;
  sessionId: string;
  companyName?: string;
  isLoading?: boolean;
}

export function ReportDisplay({
  content,
  sessionId,
  companyName,
  isLoading = false,
}: ReportDisplayProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  /**
   * COPY HANDLER
   */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    toast.success("Report copied to clipboard");
  }, [content]);

  /**
   * EXPORT AS RAW MARKDOWN
   */
  const handleExportMarkdown = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName || "report"}-${sessionId}.md`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded");
  }, [content, companyName, sessionId]);

  /**
   * EXPORT PDF HANDLER
   */
  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;

    try {
      const toastId = toast.loading("Generating PDF…");

      const canvas = await html2canvas(reportRef.current, {
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

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `${companyName || "report"}-${sessionId}-${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      toast.success("PDF exported successfully");
      toast.dismiss(toastId);
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF");
    }
  }, [companyName, sessionId]);

  /**
   * MARKDOWN STYLING MAP
   */
  const markdownComponents = {
    h1: (props: any) => (
      <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
    ),
    h2: (props: any) => (
      <h2
        className="text-lg font-semibold mt-4 mb-2 text-gray-800"
        {...props}
      />
    ),
    h3: (props: any) => (
      <h3
        className="text-base font-semibold mt-3 mb-1 text-gray-700"
        {...props}
      />
    ),
    p: (props: any) => (
      <p className="mb-2 text-sm leading-relaxed" {...props} />
    ),
    ul: (props: any) => (
      <ul className="list-disc ml-5 mb-3 text-sm space-y-1" {...props} />
    ),
    ol: (props: any) => (
      <ol className="list-decimal ml-5 mb-3 text-sm space-y-1" {...props} />
    ),
    li: (props: any) => <li className="text-sm" {...props} />,
    blockquote: (props: any) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-3 italic text-sm text-gray-700 my-3"
        {...props}
      />
    ),
    code: ({ inline, ...props }: any) =>
      inline ? (
        <code
          className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono"
          {...props}
        />
      ) : (
        <code
          className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto"
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
        className="border bg-gray-100 p-2 font-semibold text-left"
        {...props}
      />
    ),
    td: (props: any) => <td className="border p-2" {...props} />,
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
    <div className="bg-white rounded-lg border h-full flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-semibold text-sm text-gray-800">
          {companyName ? `${companyName} – Research Report` : "Research Report"}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Copy to clipboard"
          >
            <Copy size={16} className="text-gray-600" />
          </button>

          <button
            onClick={handleExportMarkdown}
            className="p-1.5 hover:bg-gray-200 rounded transition"
            title="Export Markdown"
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

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-linear-to-b from-gray-50 to-white">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-sm text-gray-600 font-medium">
                Generating report for {companyName}...
              </p>
              <p className="text-xs text-gray-500">
                Analyzing research and structuring data
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={reportRef}
            className="flex-1 overflow-y-auto p-6 prose-sm max-w-none text-gray-800"
          >
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              {companyName
                ? `Company Research: ${companyName}`
                : "Research Report"}
            </h1>

            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
