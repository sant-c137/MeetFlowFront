import React from "react";
import { CheckCircle, ArrowRight, RotateCcw, Loader2, Play } from "lucide-react";
import "./ExerciseActions.css";

const ExerciseActions = ({
  onCheck,
  onNext,
  onReset,
  submitting,
  response,
  result,
  disabled,
}) => {
  // If there is a result and it is correct, show next button
  if (result && result.correct) {
    return (
      <div className="exercise-actions-container">
        <button onClick={onNext} className="action-btn-new next-btn">
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // If there is a result but it is incorrect, show retry button
  if (result && !result.correct) {
    return (
      <div className="exercise-actions-container">
        <button onClick={onReset} className="action-btn-new retry-btn">
          <RotateCcw size={18} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // If there is no result, show check button (enabled if there is a response)
  const canCheck = response !== null && response !== undefined && response !== "" && (Array.isArray(response) ? response.length > 0 : true);

  return (
    <div className="exercise-actions-container">
      <button
        onClick={onCheck}
        disabled={!canCheck || submitting || disabled}
        className={`action-btn-new check-btn ${!canCheck ? "disabled" : ""}`}
      >
        {submitting ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <Play size={18} />
            <span>Check</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExerciseActions;
