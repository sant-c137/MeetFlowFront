import React from "react";
import { Lightbulb, CheckCircle2, XCircle, Brain } from "lucide-react";
import ExerciseActions from "./ExerciseActions";

const TheoryExercise = ({
  content,
  onResponse,
  selectedResponse,
  result,
  onCheck,
  onNext,
  onReset,
  submitting,
}) => {
  const { question, options = {}, instruction, ai_metadata } = content || {};

  const handleOptionSelect = (key) => {
    if (result || submitting) return;
    onResponse(key);
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
                "Select the correct option based on the theoretical concept."}
            </p>
          </div>

          <div className="sidebar-section hint-section">
            <div className="hint-card-new">
              <div className="hint-header">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Context</span>
              </div>
              <p className="hint-text">
                {ai_metadata?.reinforcement_for
                  ? "This exercise reinforces what you just learned."
                  : "Carefully read the question and all available options."}
              </p>
            </div>
          </div>

          {content.is_ai && (
            <div className="ai-badge-sidebar">
              <Brain size={14} />
              <span>AI Generated</span>
            </div>
          )}
        </div>

        {/* Right Column: Question and Options */}
        <div className="work-area">
          <div className="question-block-new">
            <div className="question-content">
              <span className="text-content">{question}</span>
            </div>
          </div>

          <div className="options-section-theory">
            <h4 className="options-label">Select the correct option:</h4>
            <div className="theory-options-list">
              {Object.entries(options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  disabled={!!result || submitting}
                  className={`theory-option-item ${
                    selectedResponse === key ? "selected" : ""
                  } ${
                    result && result.correct && selectedResponse === key
                      ? "correct"
                      : result && !result.correct && selectedResponse === key
                        ? "incorrect"
                        : ""
                  }`}
                >
                  <div className="option-indicator">
                    <span className="option-key">{key.toUpperCase()}</span>
                  </div>
                  <span className="option-text">{value}</span>
                </button>
              ))}
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

export default TheoryExercise;
