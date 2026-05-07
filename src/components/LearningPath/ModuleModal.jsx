import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { X, BookOpen, CheckCircle, Brain, Loader2, Play } from "lucide-react";
import { getModuleLessons } from "../../services/api";
import ExerciseSession from "../Exercises/ExerciseSession";
import "./ModuleModal.css";

// react-modal configuration
Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    padding: "0",
    borderRadius: "12px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-white)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  overlay: {
    backgroundColor: "var(--overlay)",
    zIndex: 1000,
  },
};

const ModuleModal = ({ isOpen, onRequestClose, moduleData }) => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("lessons"); // 'lessons' or 'exercises'

  const isAI = moduleData?.data?.type === "ai";

  useEffect(() => {
    if (isOpen && moduleData?.id) {
      fetchData();
      setView("lessons");
    }
  }, [isOpen, moduleData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use unit_id from the map response
      const targetId =
        moduleData.data?.unit_id || moduleData.data?.db_id || moduleData.id;
      const data = await getModuleLessons(targetId);
      setUnit(data.unit);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercises = () => {
    setView("exercises");
  };

  const handleExercisesComplete = () => {
    alert("Module completed successfully!");
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Module Details"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="module-number-badge">
              {moduleData?.data?.number}
            </div>
            <div>
              <h3
                className="modal-title"
                style={{ margin: 0, fontSize: "1.125rem" }}
              >
                {moduleData?.data?.label}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                {isAI ? "AI Reinforcement Module" : "Master Module"}
              </p>
            </div>
          </div>
          <button onClick={onRequestClose} className="modal-close-btn">
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {view === "exercises" ? (
            <ExerciseSession
              moduleId={
                moduleData.data?.unit_id ||
                moduleData.data?.db_id ||
                moduleData.id
              }
              isAI={isAI}
              onComplete={handleExercisesComplete}
              onCancel={() => setView("lessons")}
            />
          ) : loading ? (
            <div className="loading-container">
              <Loader2
                className="animate-spin"
                size={32}
                color="var(--color-primary)"
              />
              <p style={{ color: "var(--text-muted)" }}>Loading content...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <p style={{ color: "var(--error)", marginBottom: "1rem" }}>
                {error}
              </p>
              <button
                onClick={fetchData}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {unit && (
                <div className="lesson-card">
                  <div className="lesson-header">
                    <div className="lesson-icon-wrapper">
                      {isAI ? (
                        <Brain size={20} color="var(--color-third)" />
                      ) : (
                        <BookOpen size={20} color="var(--color-primary)" />
                      )}
                    </div>
                    <div className="lesson-info">
                      <h4 className="lesson-title">{unit.title}</h4>
                      <div className="lesson-text">
                        <p>{unit.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={handleStartExercises}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg"
                >
                  <Play size={20} fill="white" />
                  Start Challenges
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModuleModal;
