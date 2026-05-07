import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Brain,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { getUnitSession, checkExercise } from "../../services/api";
import FillInBlanks from "./FillInBlanks";
import Parsons from "./Parsons";
import Debugging from "./Debugging";
import CodeChallenge from "./CodeChallenge";
import TheoryExercise from "./TheoryExercise";
import "./Exercises.css";

const ExerciseSession = ({ moduleId, isAI = false, onComplete, onCancel }) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getUnitSession(moduleId);
        setExercises(data || []);
      } catch (err) {
        console.error("Error fetching session:", err);
        setError(
          err.response?.data?.error || "Could not load the exercise session.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [moduleId, isAI]);

  const currentExercise = exercises[currentIndex];

  const handleCheck = async (localPyodideResult = null) => {
    if (!response || submitting) return;

    try {
      setSubmitting(true);

      let data;
      const isAIExercise = currentExercise?.is_ai || isAI;

      if (localPyodideResult && localPyodideResult.success) {
        // If already validated locally with Pyodide, send to backend to persist progress
        // Send is_correct: true so the backend marks it as completed directly.
        const backendResult = await checkExercise(
          currentExercise.id,
          response,
          isAIExercise,
          true, // is_correct: true
        );

        if (backendResult.correct) {
          data = {
            correct: true,
            output: localPyodideResult.output,
            message: "Excellent work!",
            explanation: "Your code executed correctly and progress was saved.",
          };
        } else {
          data = {
            ...backendResult,
            output: localPyodideResult.output || backendResult.output,
          };
        }
      } else {
        data = await checkExercise(currentExercise.id, response, isAIExercise);
      }

      setResult(data);
    } catch (err) {
      console.error("Error checking exercise:", err);
      if (localPyodideResult && localPyodideResult.success) {
        setResult({
          correct: true,
          message: "Completed locally!",
          explanation:
            "The code is correct, but there was an error connecting to the server. Your progress might not be saved.",
        });
      } else {
        alert(err.response?.data?.error || "Error validating the exercise.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setResponse(null);
      setResult(null);
    } else {
      onComplete();
    }
  };

  const renderExerciseType = () => {
    const props = {
      content: {
        ...(currentExercise.content || {}),
        ...currentExercise, // Spread the exercise itself to handle flat structures
      },
      onResponse: setResponse,
      selectedResponse: response,
      result: result,
      onCheck: handleCheck,
      onNext: handleNext,
      onReset: () => {
        setResult(null);
        setResponse(null);
      },
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
          <div className="p-4 text-center text-gray-400">
            Unsupported exercise type: {currentExercise.type}
          </div>
        );
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={40} />
        <p className="text-gray-400 animate-pulse">
          Preparing your adaptive session...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
          <AlertCircle size={32} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Session Error
          </h3>
          <p className="text-gray-500">{error}</p>
        </div>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          Back to map
        </button>
      </div>
    );

  if (!currentExercise) return null;

  const isAdaptive = currentExercise.is_adaptive;

  return (
    <div className="exercise-session-container">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {currentExercise.content.title || "Exercise"}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentIndex + 1) / exercises.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {currentIndex + 1} / {exercises.length}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-indigo-500 font-bold text-sm">
              <Sparkles size={16} />
              <span>Adaptive AI</span>
            </div>
            {currentExercise.content.ai_focus && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Focused on:{" "}
                <span className="font-semibold">
                  {currentExercise.content.ai_focus}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExercise.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-24"
          >
            {renderExerciseType()}
          </motion.div>
        </AnimatePresence>

        {/* Feedback / Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 ${
                      result.correct
                        ? "bg-green-50 border border-green-100"
                        : "bg-red-50 border border-red-100"
                    }`}
                  >
                    {result.correct ? (
                      <CheckCircle2
                        className="text-green-600 shrink-0"
                        size={20}
                      />
                    ) : (
                      <XCircle className="text-red-600 shrink-0" size={20} />
                    )}
                    <div>
                      <p
                        className={`font-bold text-sm ${result.correct ? "text-green-700" : "text-red-700"}`}
                      >
                        {result.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.explanation}
                      </p>

                      {!result.correct && result.ai_feedback && (
                        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
                          <Brain
                            className="text-indigo-600 shrink-0"
                            size={16}
                          />
                          <p className="text-[11px] text-indigo-700 leading-relaxed">
                            <strong>AI Tip:</strong> {result.ai_feedback}
                          </p>
                        </div>
                      )}

                      {!result.correct && result.flagged_for_ai && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm mb-1">
                            <Sparkles size={18} />
                            <span>Generated AI Reinforcement</span>
                          </div>
                          <p className="text-xs text-purple-600 mb-3">
                            It seems like this topic is costing you a bit. Don't
                            worry! AI has generated a personalized reinforcement
                            path for you.
                          </p>
                          <button
                            onClick={onCancel}
                            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                          >
                            Back to map to see the reinforcement
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3">
              {!result ? (
                <button
                  onClick={handleCheck}
                  disabled={!response || submitting}
                  className="px-12 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Check"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={`px-8 py-3 font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg ${
                    result.correct
                      ? "bg-green-600 text-white hover:bg-green-500"
                      : "bg-gray-800 text-white hover:bg-gray-700"
                  }`}
                >
                  {currentIndex === exercises.length - 1 ? "Finish" : "Next"}
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSession;
