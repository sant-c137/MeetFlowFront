import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Interceptor to include authentication token and CSRF
api.interceptors.request.use((config) => {
  // Authentication token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // CSRF token for methods that modify data
  if (
    ["post", "put", "delete", "patch"].includes(config.method?.toLowerCase())
  ) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }

  return config;
});

export const getLearningMap = async () => {
  const response = await api.get("/api/map/");
  return response.data;
};

// --- Adaptive System ---

export const getUnitSession = async (unitId) => {
  const response = await api.get(`/api/units/${unitId}/session/`);
  return response.data;
};

export const checkExercise = async (
  exerciseId,
  response_data,
  is_ai = false,
  is_correct = null,
) => {
  const payload = {
    response: response_data,
    answer: response_data, // Also send as 'answer' according to requirement
    is_ai: is_ai,
  };

  if (is_correct !== null) {
    payload.is_correct = is_correct;
  }

  const response = await api.post(
    `/api/exercises/${exerciseId}/check/`,
    payload,
  );
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get("/api/user/stats/");
  return response.data;
};

export const getModuleLessons = async (moduleId) => {
  const response = await api.get(`/api/module/${moduleId}/lessons/`);
  return response.data;
};

export const getAIReinforcement = async (moduleId) => {
  const response = await api.post(`/api/modules/${moduleId}/ai-generate/`);
  return response.data;
};

export default api;
