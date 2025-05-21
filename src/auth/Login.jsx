import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isAuthenticated, updateAuthStatus } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8000/api/login/",
        {
          username,
          password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        updateAuthStatus(true);
      }
    } catch (err) {
      setError("Invalid username or password");
      console.error("Login error:", err);
    }
  };

  return isAuthenticated ? (
    <Navigate to="/home" replace />
  ) : (
    <>
      <form onSubmit={handleSubmit} className="login-form">
        <h1 className="login-title">Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <Button type="submit" Text="Login" />
        {error && <p className="error-message">{error}</p>}
      </form>
    </>
  );
};

export default Login;
