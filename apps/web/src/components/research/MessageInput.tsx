import { useState, useRef } from "react";
import { Send, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  mode: "chat" | "voice";
  sessionId: string;
}

export function MessageInput({
  onSendMessage,
  disabled,
  mode,
  sessionId,
}: MessageInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleVoiceRecord = async () => {
    if (mode === "voice") {
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            // Stop all tracks to release microphone
            stream.getTracks().forEach((track) => track.stop());

            // Send audio blob to backend for transcription
            await transcribeAudio(audioBlob);
          };

          mediaRecorder.start();
          setIsRecording(true);
        } catch (error) {
          console.error("Failed to start recording:", error);
          toast.error("Failed to access microphone");
        }
      } else {
        // Stop recording
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        // Call tRPC to transcribe audio
        const result = await trpc.agent.transcribeAudio.mutate({
          sessionId,
          audioBase64: base64Audio,
        });

        if (result.transcribedText) {
          setInput(result.transcribedText);
          toast.success("Audio transcribed successfully");
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Failed to transcribe audio:", error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the company..."
          disabled={disabled || isTranscribing}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />

        {mode === "voice" && (
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={disabled || isTranscribing}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-200 hover:bg-gray-300"
            } disabled:opacity-50`}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>
        )}

        <button
          type="submit"
          disabled={disabled || !input.trim() || isTranscribing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={18} />
        </button>
      </div>
      {isTranscribing && (
        <p className="text-sm text-gray-500">Transcribing audio...</p>
      )}
    </form>
  );
}
