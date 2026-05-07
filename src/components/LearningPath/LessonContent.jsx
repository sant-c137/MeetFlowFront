import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Puzzle,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUnitSession, checkExercise } from "../../services/api";
import FillInBlanks from "../Exercises/FillInBlanks";
import Parsons from "../Exercises/Parsons";
import Debugging from "../Exercises/Debugging";
import CodeChallenge from "../Exercises/CodeChallenge";
import TheoryExercise from "../Exercises/TheoryExercise";
import "./LessonContent.css";
import "../Exercises/Exercises.css";

const LessonContent = ({ lesson, onClose, onProgressUpdate }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [allCompletedAtStart, setAllCompletedAtStart] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  useEffect(() => {
    if (!lesson) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);
        setResult(null);
        setResponse(null);
        setSessionCompleted(false);
        setAllCompletedAtStart(false);
        setIsReviewMode(false);

        // Use db_id as priority for the API according to instructions
        const targetId =
          lesson.data?.db_id || lesson.data?.unit_id || lesson.id;
        const data = await getUnitSession(targetId);

        // Sort: adaptive first (optional, maintaining previous logic)
        const adaptive = data.filter((ex) => ex.is_adaptive);
        const standard = data.filter((ex) => !ex.is_adaptive);
        const sortedExercises = [...adaptive, ...standard];

        setExercises(sortedExercises);

        // Find the first pending exercise
        const firstPendingIndex = sortedExercises.findIndex(
          (ex) => !ex.is_completed,
        );
        console.log(
          "Exercises loaded:",
          sortedExercises.map((ex) => ({
            id: ex.id,
            completed: ex.is_completed,
          })),
        );

        console.log({ sortedExercises });

        console.log("First pending found at index:", firstPendingIndex);

        if (firstPendingIndex === -1 && sortedExercises.length > 0) {
          // All completed
          setAllCompletedAtStart(true);
          setCurrentIndex(0);
        } else {
          setCurrentIndex(firstPendingIndex !== -1 ? firstPendingIndex : 0);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
        setError(err.response?.data?.error || "Could not load the session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [lesson]);

  const currentExercise = exercises[currentIndex];
  const isAIUnit = currentExercise?.is_ai || lesson.data?.type === "ai";

  const handleCheck = async (localPyodideResult = null) => {
    // For code exercises, "response" can come from the editor (textarea)
    // Ensure we have the most recent value.
    const currentResponse = response;

    if (currentResponse === null || currentResponse === undefined || submitting)
      return;

    try {
      setSubmitting(true);

      let data;
      if (localPyodideResult && localPyodideResult.success) {
        // If already validated locally with Pyodide, send to backend to persist progress.
        // It's CRITICAL that the backend receives is_ai: true if it's an AI exercise.
        // Send is_correct: true so the backend marks it as completed directly.
        const backendResult = await checkExercise(
          currentExercise.id,
          currentResponse,
          isAIUnit,
          true, // is_correct: true
        );

        // If backend confirms it's correct, use local success for UI (faster and has output)
        if (backendResult.correct) {
          data = {
            correct: true,
            output: localPyodideResult.output,
            message: "Excellent work!",
            explanation:
              "Your code executed correctly in the browser and progress was saved.",
          };
        } else {
          // If backend disagrees, show backend error
          // This helps the user see why progress isn't saved.
          data = {
            ...backendResult,
            output: localPyodideResult.output || backendResult.output,
          };
        }
      } else {
        // Standard server-side validation
        data = await checkExercise(
          currentExercise.id,
          currentResponse,
          isAIUnit,
        );
      }

      setResult(data);

      // If correct, mark as completed locally
      if (data.correct && !isReviewMode) {
        setExercises((prev) =>
          prev.map((ex, idx) =>
            idx === currentIndex ? { ...ex, is_completed: true } : ex,
          ),
        );
      }

      // Notify parent component of a change (progress or AI generation)
      // Called whenever there's a server response, in case AI lessons were generated on the backend
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (err) {
      console.error("Error checking exercise:", err);
      // If server fails but Pyodide said it was okay, notify that progress wasn't saved
      if (localPyodideResult && localPyodideResult.success) {
        setResult({
          correct: true,
          message: "Completed locally!",
          explanation:
            "The code is correct, but there was an error connecting to the server. Your progress might not be saved.",
        });
      } else {
        alert(err.response?.data?.error || "Error validating.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setResponse(null);
      setResult(null);

      // If the next exercise is already completed, we could notify or just let it pass
      // But according to the auto-skip requirement, this is for initial load.
    } else {
      setSessionCompleted(true);
    }
  };

  const renderExerciseType = () => {
    if (!currentExercise) return null;

    const props = {
      content: {
        ...(currentExercise.content || {}),
        // Direct fields from the exercise object
        instruction: currentExercise.instruction,
        ai_focus: currentExercise.ai_focus,
        title: currentExercise.title,
        expected_output: currentExercise.expected_output,
        pyodide_test_code: currentExercise.pyodide_test_code,
        initial_code:
          currentExercise.initial_code || currentExercise.content?.initial_code,
        // Fields for theory / AI exercises
        question: currentExercise.question || currentExercise.content?.question,
        options: currentExercise.options || currentExercise.content?.options,
        ai_metadata:
          currentExercise.ai_metadata || currentExercise.content?.ai_metadata,
        is_ai: currentExercise.is_ai || currentExercise.content?.is_ai,
      },
      onResponse: setResponse,
      selectedResponse: response,
      result: result,
      isAdaptive: currentExercise.is_adaptive,
      onCheck: handleCheck,
      onNext: handleNext,
      onReset: () => setResult(null),
      submitting: submitting,
    };

    switch (currentExercise.type) {
      case "BLANKS":
        return <FillInBlanks {...props} />;
      case "PARSONS":
        return <Parsons {...props} />;
      case "DEBUG":
        return <Debugging {...props} />;
      case "CODE":
        return <CodeChallenge {...props} />;
      case "THEORY":
        return <TheoryExercise {...props} />;
      default:
        return (
          <div className="p-4 text-center">
            Unsupported type: {currentExercise.type}
          </div>
        );
    }
  };

  if (!lesson) return null;

  if (loading) {
    return (
      <motion.div
        className="lesson-content-container"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
      >
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="animate-spin text-purple-500" size={48} />
          <p className="text-gray-400">Loading exercises...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="lesson-content-container"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
      >
        <div className="p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  if (allCompletedAtStart || sessionCompleted) {
    return (
      <motion.div
        className="lesson-content-container completion-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="completion-overlay">
          <motion.div
            className="completion-card"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="completion-icon-wrapper">
              <Sparkles size={48} className="text-yellow-400" />
            </div>

            <h3 className="completion-title">
              {allCompletedAtStart ? "Unit Passed!" : "Session Completed!"}
            </h3>

            <p className="completion-description">
              {allCompletedAtStart
                ? "You have already mastered all the concepts of this unit. Do you want to refresh your knowledge or keep moving forward?"
                : "You have finished all the exercises of this session successfully. Good job!"}
            </p>

            <div className="completion-actions">
              <button
                onClick={() => {
                  setAllCompletedAtStart(false);
                  setSessionCompleted(false);
                  setIsReviewMode(true);
                  setCurrentIndex(0);
                }}
                className="action-btn review-btn"
              >
                <RotateCcw size={20} />
                Review Mode
              </button>

              <button onClick={onClose} className="action-btn map-btn">
                <ArrowRight size={20} />
                Back to Map
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Remove the old sessionCompleted block that was after

  const isAdaptive = currentExercise?.is_adaptive;

  return (
    <motion.div
      className="lesson-content-container"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
    >
      {/* Sketch Style Header */}
      <div className="lesson-header-new">
        <div className="header-left">
          <div className="exercise-icon-container">
            <Puzzle size={24} className="text-white" />
          </div>
          <div className="exercise-title-info">
            <span className="module-name-tag">{lesson.data?.label}</span>
            <h2 className="exercise-main-title flex items-center gap-2">
              {currentIndex + 1}.{" "}
              {currentExercise?.content?.title || "Exercise"}
              {currentExercise?.is_completed && (
                <CheckCircle2 size={18} className="text-green-500 inline" />
              )}
            </h2>
            <div className="progress-segments">
              {exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className={`segment ${
                    ex.is_completed
                      ? "completed"
                      : idx === currentIndex
                        ? "current"
                        : ""
                  }`}
                />
              ))}
              <span className="progress-text">
                {currentIndex + 1} / {exercises.length}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <button className="close-lesson-btn-new" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="lesson-body-new">
        <div className="exercise-content-layout">
          <div className="main-exercise-column">
            {renderExerciseType()}

            {/* Result feedback (Correct/Incorrect) */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`result-feedback-card ${result.correct ? "correct" : "incorrect"}`}
                >
                  <div className="feedback-icon">
                    {result.correct ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <XCircle size={20} />
                    )}
                  </div>
                  <div className="feedback-text">
                    <strong>
                      {result.correct ? "Excellent!" : "Almost there"}
                    </strong>
                    <p>
                      {result.explanation ||
                        currentExercise?.content?.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LessonContent;
