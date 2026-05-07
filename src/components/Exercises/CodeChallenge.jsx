import React, { useRef, useState, useEffect } from "react";
import {
  RotateCcw,
  Play,
  Terminal,
  Lightbulb,
  Brain,
  Sparkles,
  Command,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import ExerciseActions from "./ExerciseActions";
import { usePyodide } from "../../hooks/usePyodide";

const CodeChallenge = ({
  content,
  onResponse,
  selectedResponse,
  result,
  onCheck,
  onNext,
  onReset,
  submitting,
}) => {
  // Now these fields come directly thanks to the mapping in LessonContent
  const {
    initial_code,
    pyodide_test_code,
    expected_output,
    instruction,
    ai_focus,
  } = content || {};

  const textareaRef = useRef(null);
  const { isReady, evaluatePython } = usePyodide();
  const [localResult, setLocalResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize with the initial code if there is no response yet
  useEffect(() => {
    if (!selectedResponse && initial_code) {
      onResponse(initial_code);
    }
  }, [initial_code, onResponse, selectedResponse]);

  const handleExecute = async () => {
    if (!isReady || isRunning) return;

    setIsRunning(true);
    setLocalResult(null);

    const evaluation = await evaluatePython(
      selectedResponse,
      pyodide_test_code || "",
      expected_output || null,
    );

    setLocalResult(evaluation);
    setIsRunning(false);

    // If Pyodide correctly validates the code, we call onCheck
    // passing the result so that LessonContent accepts it.
    if (evaluation.success && onCheck) {
      onCheck(evaluation);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const newValue =
        value.substring(0, selectionStart) +
        "    " +
        value.substring(selectionEnd);

      onResponse(newValue);

      // Reposition the cursor after rendering
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = selectionStart + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="exercise-mini-reto-new">
      <div className="fill-blanks-split-layout">
        {/* Left Column: Instructions and Console */}
        <div className="instructions-sidebar">
          <div className="sidebar-section">
            <div className="flex items-center gap-2 mb-2">
              <Command size={18} className="text-indigo-400" />
              <h4 className="sidebar-label m-0">Code Challenge</h4>
            </div>
            <p className="exercise-instructions">
              {instruction ||
                "Write the code necessary to solve the challenge."}
            </p>
          </div>

          <div className="sidebar-section">
            <div className="hint-card-new">
              <div className="hint-header">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Hint</span>
              </div>
              <p className="hint-text text-xs">
                {ai_focus
                  ? `Focused on: ${ai_focus}`
                  : "Remember to use correct indentation for code blocks."}
              </p>
            </div>
          </div>

          <div className="sidebar-section mt-auto">
            <h4 className="sidebar-label">Console</h4>
            <div className="console-output">
              <div className="console-line">
                <span className="text-emerald-500 mr-2">$</span>
                <span className="text-gray-400 italic text-xs">
                  {isRunning
                    ? "Running..."
                    : localResult || result
                      ? "Execution finished."
                      : isReady
                        ? "Waiting for execution..."
                        : "Loading Python engine..."}
                </span>
              </div>

              {/* Show Pyodide or server errors */}
              {(localResult?.error || result?.error) && (
                <div className="console-line mt-1">
                  <div className="flex items-start gap-2 text-red-400 font-mono text-xs">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <pre className="whitespace-pre-wrap">
                      {localResult?.error || result?.error}
                    </pre>
                  </div>
                </div>
              )}

              {/* Show Pyodide or server output */}
              {(localResult?.output || result?.output) && (
                <div className="console-line mt-1">
                  <pre className="text-white text-xs font-mono">
                    {localResult?.output || result?.output}
                  </pre>
                </div>
              )}

              {/* Success indicator if by Pyodide */}
              {localResult?.success && (
                <div className="console-line mt-2 flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 size={12} />
                  <span>Tests passed locally</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="work-area">
          <div className="code-block-new editor-container">
            <div className="editor-header">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-gray-400" />
                <span className="editor-filename">main.py</span>
              </div>
              <div className="flex gap-1.5 ml-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30"></div>
              </div>
            </div>

            <div className="editor-body">
              <textarea
                ref={textareaRef}
                value={selectedResponse || ""}
                onChange={(e) => onResponse(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your code here..."
                className="editor-textarea-simple"
                spellCheck="false"
              />
            </div>

            <div className="editor-footer">
              <div className="flex gap-2">
                <button
                  className="editor-btn-reset"
                  onClick={() => onResponse(initial_code || "")}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>

                <button
                  className={`editor-btn-run ${isRunning || !isReady ? "disabled" : ""}`}
                  onClick={handleExecute}
                  disabled={isRunning || !isReady}
                >
                  {isRunning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  {isReady ? "Run Code" : "Loading..."}
                </button>
              </div>
              <span className="editor-info">Python 3.10 (Pyodide)</span>
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

export default CodeChallenge;
