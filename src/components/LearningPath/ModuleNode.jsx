import { Handle, Position } from "@xyflow/react";
import {
  Check,
  AlertCircle,
  Lock,
  Sparkles,
  Puzzle,
  Code,
  FileSearch,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

const ModuleNode = ({ data, targetPosition, sourcePosition }) => {
  const { label, status, number, type, progress, reinforcement_type } = data;

  const getStatusClass = () => {
    switch (status) {
      case "COMPLETED":
        return "node-completed";
      case "AVAILABLE":
        return "node-available";
      case "STUCK":
        return "node-stuck";
      case "LOCKED":
        return "node-locked";
      default:
        return "";
    }
  };

  const isAI = type === "ai";

  const getAIIcon = () => {
    if (!isAI) return null;

    switch (reinforcement_type) {
      case "BLANKS":
        return <Puzzle size={18} color="#a855f7" />;
      case "CODE":
        return <Code size={18} color="#a855f7" />;
      case "DEBUG":
        return <FileSearch size={18} color="#a855f7" />;
      case "PARSONS":
        return <CheckCircle2 size={18} color="#a855f7" />;
      default:
        return <Sparkles size={18} color="#a855f7" />;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`custom-node ${getStatusClass()} ${isAI ? "node-ai" : ""}`}
    >
      <Handle type="target" position={targetPosition || Position.Top} />

      <div className="node-number">{number}</div>

      <div className="node-content">
        <span className="node-title">{label}</span>
        <span className="node-status">
          {status === "STUCK" && "Stuck"}
          {status === "AVAILABLE" &&
            (progress !== undefined && progress !== null
              ? `${progress}%`
              : "0%")}
          {status === "COMPLETED" && "100%"}
          {status === "LOCKED" && "Locked"}
          {isAI && " (AI)"}
        </span>
      </div>

      <div className="node-icon">
        {status === "COMPLETED" && <Check size={18} color="#10b981" />}
        {status === "LOCKED" && <Lock size={18} color="#94a3b8" />}
        {status === "STUCK" && <AlertCircle size={18} color="#f43f5e" />}
        {isAI && status !== "LOCKED" && getAIIcon()}
      </div>

      <Handle type="source" position={sourcePosition || Position.Bottom} />
    </motion.div>
  );
};

export default ModuleNode;
