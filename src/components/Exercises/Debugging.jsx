import React from "react";
import { Lightbulb, Brain, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExerciseActions from "./ExerciseActions";

const Debugging = ({
  content,
  onResponse,
  selectedResponse,
  result,
  onCheck,
  onNext,
  onReset,
  submitting,
}) => {
  const { lines = [], instruction, ai_focus } = content || {};

  return (
    <div className="exercise-debugging-new">
      <div className="fill-blanks-split-layout">
        {/* Left Column: Instructions and Selection Information */}
        <div className="instructions-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-label">Instructions</h4>
            <p className="exercise-instructions">
              {instruction ||
                "Identify and select the line that contains the error."}
            </p>
          </div>

          <div className="sidebar-section hint-section">
            <div className="hint-card-new">
              <div className="hint-header">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Status</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${selectedResponse ? "bg-indigo-600 text-white" : "bg-var(--bg-hover) text-var(--text-muted) border border-var(--border-color)"}`}
                >
                  {selectedResponse || "?"}
                </div>
                <p className="text-sm text-var(--text-muted) leading-tight">
                  {selectedResponse
                    ? `You have marked line ${selectedResponse} as the error.`
                    : "Tap a line of code to mark it."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code to debug */}
        <div className="work-area">
          <div className="code-block-new debugging-container">
            <div className="w-full flex flex-col">
              {(lines || []).map((line, index) => {
                const lineNumber = index + 1;
                const isSelected = selectedResponse === line.id;

                return (
                  <div
                    key={line.id}
                    className={`debugging-line ${isSelected ? "selected" : ""}`}
                    onClick={() => !result && onResponse(line.id)}
                  >
                    <div className="line-number">{lineNumber}</div>
                    <div className="flex-grow overflow-hidden">
                      <SyntaxHighlighter
                        language="python"
                        style={oneDark}
                        customStyle={{
                          background: "transparent",
                          padding: 0,
                          margin: 0,
                          fontSize: "1rem",
                        }}
                        PreTag="div"
                      >
                        {line.text}
                      </SyntaxHighlighter>
                    </div>
                    {isSelected && (
                      <div className="error-indicator">
                        <AlertCircle size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ExerciseActions
        onCheck={onCheck}
        onNext={onNext}
        onReset={onReset}
        submitting={submitting}
        response={selectedResponse}
        result={result}
      />
    </div>
  );
};

export default Debugging;
