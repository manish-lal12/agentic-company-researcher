interface Finding {
  id: string;
  category: string;
  title: string;
  content: string;
  source?: string;
  confidence?: number;
}

interface FindingsListProps {
  findings: Finding[];
  sessionId: string;
}

export function FindingsList({ findings, sessionId }: FindingsListProps) {
  // Group findings by category
  const groupedFindings = findings.reduce((acc, finding) => {
    if (!acc[finding.category]) {
      acc[finding.category] = [];
    }
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, Finding[]>);

  return (
    <div className="bg-white rounded-lg border p-4 h-full overflow-y-auto">
      <h2 className="font-semibold mb-4 text-lg">Research Findings</h2>

      {findings.length === 0 ? (
        <p className="text-sm text-gray-500">
          No findings yet. Ask questions to gather information.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFindings).map(
            ([category, categoryFindings]) => (
              <div key={category} className="border-b pb-4">
                <h3 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                  {category.replace("_", " ")}
                </h3>
                <div className="space-y-2">
                  {categoryFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className="bg-gray-50 rounded p-2 text-xs border-l-2 border-blue-400"
                    >
                      <p className="font-medium">{finding.title}</p>
                      <p className="text-gray-600 line-clamp-2">
                        {finding.content}
                      </p>
                      {finding.source && (
                        <p className="text-gray-500 text-xs mt-1">
                          Source: {finding.source}
                        </p>
                      )}
                      {finding.confidence && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-gray-500 text-xs">
                            Confidence:
                          </span>
                          <div className="w-12 h-1 bg-gray-200 rounded">
                            <div
                              className="h-full bg-blue-500 rounded"
                              style={{ width: `${finding.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
