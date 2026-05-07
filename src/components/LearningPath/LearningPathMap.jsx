import { useMemo, useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Maximize2, Minimize2, RotateCcw, Loader2 } from "lucide-react";
import dagre from "dagre";

import ModuleNode from "./ModuleNode";
import ModuleModal from "./ModuleModal";
import "./LearningPath.css";
import { getLearningMap } from "../../services/api";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 60,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const LearningPathMapContent = ({
  onLessonSelect,
  isSidebarOpen,
  refreshTrigger,
}) => {
  const nodeTypes = useMemo(
    () => ({
      moduleNode: ModuleNode,
    }),
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fitView } = useReactFlow();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Effect to center the graph when the container size changes
  useEffect(() => {
    const container = document.querySelector(".learning-path-container");
    if (!container) return;

    let timeoutId;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          fitView({ padding: 0.5 });
        });
      }, 100);
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [fitView]);

  // Effect to center the graph when the sidebar state changes (with animation)
  useEffect(() => {
    const frames = [50, 150, 300, 450, 600, 800];
    const timers = frames.map((ms) =>
      setTimeout(() => {
        // Use duration only in the last frame for final smoothness
        fitView({ duration: ms === 800 ? 400 : 0, padding: 0.5 });
      }, ms),
    );

    return () => timers.forEach(clearTimeout);
  }, [isSidebarOpen, fitView]);

  const onNodeClick = (_, node) => {
    // AI lessons can be entered if they are AVAILABLE or COMPLETED, even if the parent is STUCK
    const isAI = node.data?.type === "ai";
    const canAccessAI =
      isAI &&
      (node.data.status === "AVAILABLE" || node.data.status === "COMPLETED");
    const isUnlocked = node.data.status !== "LOCKED";

    if (canAccessAI || isUnlocked) {
      if (onLessonSelect) {
        onLessonSelect(node);
      } else {
        setSelectedNode(node);
        setIsModalOpen(true);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
    // Refetch map to see if AI generated new modules during the session
    fetchMap(false);
    // Recentering after closing the modal or changing content
    setTimeout(() => fitView({ duration: 800, padding: 0.5 }), 100);
  };

  // Recentering when nodes or container size change
  useEffect(() => {
    if (nodes.length > 0) {
      fitView({
        duration: 800,
        padding: 0.5, // Increase padding for better centering
      });
    }
  }, [nodes, fitView]);

  const onLayout = useCallback(
    (direction) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges],
  );

  const fetchMap = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const data = await getLearningMap();

        const mappedNodes = (data.nodes || []).map((node) => {
          const progressValue =
            node.data.completion_percentage !== undefined
              ? Math.round(node.data.completion_percentage)
              : 0;

          return {
            ...node,
            id: String(node.id), // Use the ID from the response (e.g., "2" or "2.1")
            data: {
              ...node.data,
              // The backend now sends display_id for the visual label
              number: node.data.display_id || String(node.id),
              progress: progressValue,
            },
          };
        });

        const mappedEdges = (data.edges || []).map((edge) => {
          const sourceNode = mappedNodes.find(
            (n) => n.id === String(edge.source),
          );
          const targetNode = mappedNodes.find(
            (n) => n.id === String(edge.target),
          );

          const isCompleted =
            sourceNode?.data?.status === "COMPLETED" &&
            targetNode?.data?.status === "COMPLETED";
          const isInProgress =
            sourceNode?.data?.status === "COMPLETED" &&
            targetNode?.data?.status === "AVAILABLE";

          const isLocked = sourceNode?.data?.status !== "COMPLETED";
          const isAINodeConnection =
            sourceNode?.data?.type === "ai" || targetNode?.data?.type === "ai";

          return {
            ...edge,
            id: edge.id || `e${edge.source}-${edge.target}`,
            label: "",
            animated: isInProgress,
            type: "smoothstep",
            style: {
              stroke: isCompleted
                ? "#10b981"
                : isInProgress
                  ? "#3b82f6"
                  : "#cbd5e1",
              strokeWidth: 3,
              strokeDasharray: isAINodeConnection ? "5,5" : "0", // Dotted lines only for AI nodes
              opacity: isLocked ? 0.6 : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isCompleted
                ? "#10b981"
                : isInProgress
                  ? "#3b82f6"
                  : "#cbd5e1",
            },
            pathOptions: {
              borderRadius: 20,
            },
          };
        });

        // If there are new nodes or it's the initial load, apply full layout
        const hasNewNodes = mappedNodes.length !== nodes.length;
        const hasNewEdges = mappedEdges.length !== edges.length;

        if (isInitial || nodes.length === 0 || hasNewNodes || hasNewEdges) {
          const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(mappedNodes, mappedEdges);
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);

          // If new nodes were added silently, adjust view
          if (!isInitial && (hasNewNodes || hasNewEdges)) {
            setTimeout(() => fitView({ duration: 800, padding: 0.5 }), 100);
          }
        } else {
          // Silent data update without changing positions
          setNodes((prevNodes) =>
            prevNodes.map((prevNode) => {
              const newNode = mappedNodes.find((n) => n.id === prevNode.id);
              return newNode ? { ...prevNode, data: newNode.data } : prevNode;
            }),
          );
          setEdges(mappedEdges);
        }
      } catch (err) {
        console.error("Error fetching learning map:", err);
        if (isInitial) {
          setError("Could not load the learning map. Please try again later.");
        }
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [nodes.length, edges.length, setNodes, setEdges, fitView],
  );

  useEffect(() => {
    // Initial load
    if (nodes.length === 0) {
      fetchMap(true);
    } else {
      // Triggered update
      fetchMap(false);
    }
  }, [refreshTrigger]);

  // Polling for automatic updates (every 15 seconds for more reactivity)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMap(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchMap]);

  if (loading) {
    return (
      <div className="learning-path-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-lg font-medium text-gray-600">
            Loading your learning path...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-path-container flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-red-800 font-bold text-lg mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-path-container">
      <div className="learning-path-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#10b981" }}></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#3b82f6" }}></div>
          <span>In progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#f43f5e" }}></div>
          <span>Stuck</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#a855f7" }}></div>
          <span>AI generated</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: "#cbd5e1" }}></div>
          <span>Locked</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" variant="dots" gap={20} size={1} />
      </ReactFlow>

      <ModuleModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        moduleData={selectedNode}
      />

      <div className="controls-overlay">
        <button
          className="control-btn"
          onClick={() => fitView({ duration: 400 })}
        >
          <RotateCcw size={18} /> Recenter
        </button>
        <button className="control-btn" onClick={() => onLayout("TB")}>
          <Minimize2 size={18} /> Vertical
        </button>
        <button className="control-btn" onClick={() => onLayout("LR")}>
          <Maximize2 size={18} /> Horizontal
        </button>
      </div>

      <button className="simulate-btn">
        <Play size={18} fill="white" />
        Simulate learning
      </button>
    </div>
  );
};

const LearningPathMap = (props) => {
  return (
    <ReactFlowProvider>
      <LearningPathMapContent {...props} />
    </ReactFlowProvider>
  );
};

export default LearningPathMap;
