import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, Lightbulb, Plus, X, ArrowDown } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExerciseActions from "./ExerciseActions";

const Parsons = ({
  content,
  onResponse,
  selectedResponse,
  result,
  onCheck,
  onNext,
  onReset,
  submitting,
}) => {
  const { blocks = [], instruction, ai_focus, trap_blocks = [] } = content || {};

  // Available blocks (original + traps)
  const [availableItems, setAvailableItems] = useState(() => {
    const allBlocks = [...(blocks || []), ...(trap_blocks || [])];
    return [...allBlocks].sort(() => Math.random() - 0.5);
  });

  // Selected blocks for the response
  const [selectedItems, setSelectedItems] = useState([]);

  // Notify parent when selected items change
  useEffect(() => {
    onResponse(selectedItems.map((item) => item.id));
  }, [selectedItems, onResponse]);

  const addToSelection = (item) => {
    if (result) return;
    setAvailableItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelectedItems((prev) => [...prev, item]);
  };

  const removeFromSelection = (item) => {
    if (result) return;
    setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    setAvailableItems((prev) => [...prev, item]);
  };

  const resetExercise = () => {
    const allBlocks = [...blocks, ...(trap_blocks || [])];
    setAvailableItems([...allBlocks].sort(() => Math.random() - 0.5));
    setSelectedItems([]);
    onReset();
  };

  return (
    <div className="exercise-parsons-new">
      <p className="exercise-instructions">
        {instruction ||
          "Select and order the blocks to form the correct code. Watch out for traps!"}
      </p>

      <div className="parsons-layout">
        <div className="parsons-column">
          <h4 className="column-title">Available blocks</h4>
          <div className="blocks-pool">
            <AnimatePresence>
              {availableItems.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="parsons-block available"
                  onClick={() => addToSelection(item)}
                >
                  <Plus
                    size={16}
                    className="text-blue-400 mr-2 flex-shrink-0"
                  />
                  <div className="flex-grow overflow-hidden">
                    <SyntaxHighlighter
                      language="python"
                      style={oneDark}
                      customStyle={{
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                      PreTag="div"
                    >
                      {item.text}
                    </SyntaxHighlighter>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {availableItems.length === 0 && (
              <p className="empty-message">No blocks left</p>
            )}
          </div>
        </div>

        <div className="parsons-divider">
          <ArrowDown className="text-gray-300" size={24} />
        </div>

        <div className="parsons-column">
          <h4 className="column-title">Your solution</h4>
          <div className="blocks-solution">
            <AnimatePresence mode="popLayout">
              {selectedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="parsons-block selected"
                >
                  <div className="block-number">{index + 1}</div>
                  <div className="flex-grow overflow-hidden">
                    <SyntaxHighlighter
                      language="python"
                      style={oneDark}
                      customStyle={{
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                      PreTag="div"
                    >
                      {item.text}
                    </SyntaxHighlighter>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromSelection(item)}
                    disabled={!!result}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {selectedItems.length === 0 && (
              <p className="empty-message">
                Click on the blocks on the left to build your answer
              </p>
            )}
          </div>
        </div>
      </div>

      <ExerciseActions
        onCheck={onCheck}
        onNext={onNext}
        onReset={resetExercise}
        submitting={submitting}
        response={selectedItems}
        result={result}
      />
    </div>
  );
};

export default Parsons;
