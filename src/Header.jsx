import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Header.css";

import logoImage from "/logo.png";
import accountSvg from "/account.svg";
import notificationIcon from "/notifications.svg";

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsButtonRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  const accountButtonRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoadingSession(true);
      try {
        const sessionResponse = await axios.get("/api/check_session/");
        if (sessionResponse.data.authenticated && sessionResponse.data.user) {
          setUserData(sessionResponse.data.user);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error(
          "Session check failed:",
          error.response ? error.response.data : error.message,
        );
        setIsLoggedIn(false);
        setUserData(null);
      } finally {
        setIsLoadingSession(false);
      }
    };
    initialLoad();
  }, []);

  useEffect(() => {
    let intervalId = null;
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  const toggleNotificationsDropdown = () => {
    setIsNotificationsOpen((prev) => !prev);
    if (isAccountModalOpen) setIsAccountModalOpen(false);
  };

  const handleNotificationClick = async (notification) => {
    console.log("Notification clicked:", notification);
    if (!notification.read) {
      try {
        await axios.put(`/api/notifications/${notification.id}/read/`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.related_url) {
      navigate(notification.related_url);
    }
    setIsNotificationsOpen(false);
  };

  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.post("/api/notifications/mark_all_read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target) &&
        notificationsButtonRef.current &&
        !notificationsButtonRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideAccount = (event) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target) &&
        accountButtonRef.current &&
        !accountButtonRef.current.contains(event.target)
      ) {
        setIsAccountModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideAccount);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideAccount);
  }, []);

  const toggleAccountDropdown = () => {
    if (isLoggedIn) {
      setIsAccountModalOpen((prev) => !prev);
      if (isNotificationsOpen) setIsNotificationsOpen(false);
    } else {
      console.log("User not logged in. Consider prompting for login.");
    }
  };

  const handleLogout = () => {
    const cookieNames = ["sessionid", "csrftoken"];
    const path = "/";
    cookieNames.forEach((name) => {
      document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    });
    setIsLoggedIn(false);
    setUserData(null);
    setIsAccountModalOpen(false);
    setNotifications([]);
    setUnreadCount(0);
    navigate("/");

    window.location.href = "/";
  };

  const getUserInitial = () => {
    if (userData && userData.username)
      return userData.username.charAt(0).toUpperCase();
    return "";
  };

  const accountIconContent = () => {
    if (isLoadingSession) return <div className="account-avatar-loading"></div>;
    if (isLoggedIn && userData)
      return <div className="account-avatar">{getUserInitial()}</div>;
    return <img src={accountSvg} alt="Account" className="account-icon-svg" />;
  };

  return (
    <>
      <div className="header">
        <div
          className="logo-wrapper"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img src={logoImage} alt="MeetFlow Logo" className="logo-img" />
          <h1>MeetFlow</h1>
        </div>

        <div className="learning-path-header-global">
          <div className="path-title">
            <span className="path-label">Learning Path</span>
            <h2 className="path-name">Basic Python</h2>
          </div>
        </div>

        <div className="header-actions">
          {isLoggedIn && (
            <div className="notifications-section" ref={notificationsButtonRef}>
              <button
                onClick={toggleNotificationsDropdown}
                className="notifications-button"
                aria-label="Notifications"
              >
                <img src={notificationIcon} alt="Notifications" />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <div
                  className="notifications-dropdown"
                  ref={notificationsDropdownRef}
                >
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="mark-all-read-btn"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {isLoadingNotifications && (
                    <p className="loading-text">Loading...</p>
                  )}
                  {!isLoadingNotifications && notifications.length === 0 && (
                    <p className="no-notifications-text">
                      No new notifications.
                    </p>
                  )}
                  {!isLoadingNotifications && notifications.length > 0 && (
                    <ul className="notifications-list">
                      {notifications.map((notif) => (
                        <li
                          key={notif.id}
                          className={`notification-item ${
                            notif.read ? "read" : "unread"
                          }`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <span className="notification-type">
                            {notif.type_display || notif.type}
                          </span>
                          <p className="notification-message">
                            {notif.message}
                          </p>
                          <span className="notification-date">
                            {new Date(notif.creation_date).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="account-section" ref={accountButtonRef}>
            <div
              onClick={toggleAccountDropdown}
              role="button"
              tabIndex={0}
              aria-expanded={isAccountModalOpen}
              aria-label="Account menu"
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              {accountIconContent()}
            </div>

            {isAccountModalOpen && userData && (
              <div className="account-dropdown" ref={accountDropdownRef}>
                {" "}
                <div className="account-dropdown-header">
                  {" "}
                  <h2>Account Information</h2>
                  <button
                    onClick={() => setIsAccountModalOpen(false)}
                    className="close-modal-button"
                    aria-label="Close account menu"
                  >
                    ×
                  </button>
                </div>
                <div className="account-dropdown-user-details">
                  {" "}
                  <div className="user-avatar-large">{getUserInitial()}</div>
                  <p>
                    <strong>Name:</strong> {userData.username}
                  </p>
                  <p>
                    <strong>Email:</strong> {userData.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button account-dropdown-logout"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
