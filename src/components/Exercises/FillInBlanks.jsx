import React from "react";
import { Lightbulb } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExerciseActions from "./ExerciseActions";

const FillInBlanks = ({
  content,
  onResponse,
  selectedResponse,
  result,
  onCheck,
  onNext,
  onReset,
  submitting,
}) => {
  const {
    code_template,
    question,
    options = [],
    instruction,
    ai_focus,
  } = content || {};

  // Replace {{input}} or _______ with a unique token to process the text/code
  const INPUT_TOKEN = "____INPUT____";
  const rawContent = code_template || question || "";
  const fullContent = rawContent
    .replace("{{input}}", INPUT_TOKEN)
    .replace(/_______+/, INPUT_TOKEN);

  // Split the content to insert the input component
  const parts = fullContent.split(INPUT_TOKEN);
  const isCode = !!code_template;

  const handleInputChange = (e) => {
    onResponse(e.target.value);
  };

  return (
    <div className="exercise-fill-blanks-new">
      <div className="fill-blanks-split-layout">
        {/* Left Column: Instructions and Hints */}
        <div className="instructions-sidebar">
          <div className="sidebar-section">
            <h4 className="sidebar-label">Instructions</h4>
            <p className="exercise-instructions">
              {instruction ||
                "Fill in the blank so that the code works correctly."}
            </p>
          </div>

          <div className="sidebar-section hint-section">
            <div className="hint-card-new">
              <div className="hint-header">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Hint</span>
              </div>
              <p className="hint-text">
                {ai_focus
                  ? `Focused on: ${ai_focus}`
                  : "Carefully observe the question and complete the missing part."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Content and Options/Input */}
        <div className="work-area">
          <div className={isCode ? "code-block-new" : "question-block-new"}>
            <div className={isCode ? "code-content" : "question-content"}>
              {isCode ? (
                <SyntaxHighlighter
                  language="python"
                  style={oneDark}
                  PreTag={React.Fragment}
                  CodeTag={React.Fragment}
                >
                  {parts[0]}
                </SyntaxHighlighter>
              ) : (
                <span className="text-content">{parts[0]}</span>
              )}

              <div className="blank-space-container">
                {options && options.length > 0 ? (
                  <div
                    className={`blank-input ${selectedResponse ? "filled" : ""}`}
                  >
                    {selectedResponse || ""}
                  </div>
                ) : (
                  <input
                    type="text"
                    className={`text-blank-input ${result ? (result.correct ? "correct" : "incorrect") : ""}`}
                    value={selectedResponse || ""}
                    onChange={handleInputChange}
                    placeholder="..."
                    disabled={!!result || submitting}
                  />
                )}
              </div>

              {isCode ? (
                <SyntaxHighlighter
                  language="python"
                  style={oneDark}
                  PreTag={React.Fragment}
                  CodeTag={React.Fragment}
                >
                  {parts[1] || ""}
                </SyntaxHighlighter>
              ) : (
                <span className="text-content">{parts[1] || ""}</span>
              )}
            </div>
          </div>

          <div className="options-section-new">
            {options && options.length > 0 ? (
              <>
                <p className="options-label">Select the answer:</p>
                <div className="options-grid-new">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => onResponse(option)}
                      className={`option-btn-new ${selectedResponse === option ? "selected" : ""}`}
                      disabled={!!result}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="options-label">Type your answer in the blank.</p>
            )}
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

export default FillInBlanks;
