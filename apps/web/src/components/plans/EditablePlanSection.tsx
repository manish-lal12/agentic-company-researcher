import { useState } from "react";
import { Edit2, Save, X, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EditablePlanSectionProps {
  id: string;
  title: string;
  content: string;
  onSave: (title: string, content: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditablePlanSection({
  id,
  title,
  content,
  onSave,
  isLoading = false,
}: EditablePlanSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSave(editTitle, editContent);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(title);
    setEditContent(content);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Content
          </label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">Markdown is supported</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-primary transition-all"
          title="Edit section"
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert text-card-foreground">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
