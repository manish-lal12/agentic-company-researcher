import { AlertCircle, CheckCircle, Clock, Zap } from "lucide-react";

interface ResearchProgressProps {
  status: "idle" | "researching" | "analyzing" | "complete" | "error";
  message?: string;
}

interface StatusConfig {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  animate?: boolean;
}

export function ResearchProgress({
  status,
  message = "",
}: ResearchProgressProps) {
  const statusConfig: Record<string, StatusConfig> = {
    idle: {
      icon: Clock,
      label: "Ready",
      color: "text-gray-500",
      bgColor: "bg-gray-50",
    },
    researching: {
      icon: Zap,
      label: "Researching",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      animate: true,
    },
    analyzing: {
      icon: Zap,
      label: "Analyzing",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      animate: true,
    },
    complete: {
      icon: CheckCircle,
      label: "Complete",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (status === "idle") return null;

  return (
    <div
      className={`${config.bgColor} border rounded-lg p-3 flex items-center gap-2`}
    >
      <Icon
        size={18}
        className={`${config.color} ${config.animate ? "animate-spin" : ""}`}
      />
      <div>
        <p className={`${config.color} font-medium text-sm`}>{config.label}</p>
        {message && <p className="text-xs text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
