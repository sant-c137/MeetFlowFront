import { useContext, createContext, useState, useEffect } from 'react';
import { PropTypes } from 'prop-types';

const AuthContext = createContext({
  isAuthenticated: false,
  updateAuthStatus: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getCookie = (name) => {
    const match = document.cookie.match(
      new RegExp('(^| )' + name + '=([^;]+)')
    );
    return match ? match[2] : null;
  };

  const csrfToken = getCookie('csrftoken');

  const checkAuthStatus = async () => {
    if (!csrfToken) {
      setIsAuthenticated(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/api/check_session/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      setIsAuthenticated(response.ok);
    } catch (err) {
      console.error('Error checking authentication status:', err);
      setIsAuthenticated(false);
    }
  };

  const updateAuthStatus = (status) => {
    setIsAuthenticated(status);
  };

  useEffect(() => {
    checkAuthStatus();
  });

  return (
    <AuthContext.Provider value={{ isAuthenticated, updateAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

AuthProvider.propTypes = {
  children: PropTypes.node,
};
