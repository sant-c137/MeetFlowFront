import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Header.css";

import logoImage from "/logo.png";
import accountSvg from "/account.svg";
import notificationIcon from "/notifications.svg";
import searchIconSvg from "/search.svg";

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";
Modal.setAppElement("#root");

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsButtonRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoadingSession(true);
      try {
        const sessionResponse = await axios.get("/api/check_session/");
        if (sessionResponse.data.authenticated && sessionResponse.data.user) {
          setUserData(sessionResponse.data.user);
          setIsLoggedIn(true);
          fetchNotifications();
        } else {
          setIsLoggedIn(false);
          setUserData(null);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error(
          "Session check failed:",
          error.response ? error.response.data : error.message
        );
        setIsLoggedIn(false);
        setUserData(null);
      } finally {
        setIsLoadingSession(false);
      }
    };
    initialLoad();
  }, []);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    setIsLoadingNotifications(true);
    try {
      const response = await axios.get("/api/notifications/");
      const fetchedNotifications = response.data || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    let intervalId = null;
    if (isLoggedIn) {
      fetchNotifications();
      intervalId = setInterval(fetchNotifications, 30000);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  const toggleNotificationsDropdown = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    console.log("Notification clicked:", notification);
    if (!notification.read) {
      try {
        await axios.put(`/api/notifications/${notification.id}/read/`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
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
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setSearchError(null);
      return;
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearchDropdownOpen(true);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setIsSearchDropdownOpen(true);

      try {
        const response = await axios.get(
          `/api/events/search/?q=${encodeURIComponent(searchTerm)}`
        );
        setSearchResults(response.data || []);
        if (response.data.length === 0) {
          setSearchError(null);
        }
      } catch (error) {
        console.error("Error searching events:", error);
        setSearchError("Failed to fetch search results.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchResultClick = (event) => {
    navigate(`/events/${event.id}`);
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);

  const handleAccountIconClick = () => {
    if (isLoggedIn) {
      setIsAccountModalOpen(true);
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
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchDropdownOpen(false);
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

        <div className="input-wrapper" ref={searchInputRef}>
          {" "}
          <img
            src={searchIconSvg}
            alt="Search Icon"
            className="search-icon-img"
          />
          <input
            type="text"
            placeholder="Search events..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onFocus={() => setIsSearchDropdownOpen(true)}
          />
          {isSearchDropdownOpen && (
            <div className="search-results-dropdown" ref={searchDropdownRef}>
              {isSearching && (
                <div className="search-dropdown-item loading">Searching...</div>
              )}
              {searchError && (
                <div className="search-dropdown-item error">{searchError}</div>
              )}
              {!isSearching &&
                !searchError &&
                searchTerm.trim().length > 0 &&
                searchTerm.trim().length < 2 && (
                  <div className="search-dropdown-item info">
                    Type at least 2 characters.
                  </div>
                )}
              {!isSearching &&
                !searchError &&
                searchResults.length === 0 &&
                searchTerm.trim().length >= 2 && (
                  <div className="search-dropdown-item info">
                    No events found.
                  </div>
                )}
              {!isSearching && !searchError && searchResults.length > 0 && (
                <ul>
                  {searchResults.map((event) => (
                    <li
                      key={event.id}
                      className="search-dropdown-item"
                      onClick={() => handleSearchResultClick(event)}
                    >
                      {event.title}{" "}
                      {event.start_time && (
                        <span className="search-result-date">
                          - {new Date(event.start_time).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
          <div
            className="account-section"
            onClick={handleAccountIconClick}
            role="button"
            tabIndex={0}
            aria-label="Account"
          >
            {accountIconContent()}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAccountModalOpen}
        onRequestClose={() => setIsAccountModalOpen(false)}
        contentLabel="User Account Information"
        className="modal-content account-modal"
        overlayClassName="modal-overlay"
      >
        {userData && (
          <div className="user-info-modal">
            <div className="modal-header">
              <h2>Account Information</h2>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="close-modal-button"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="user-details">
              <div className="user-avatar-large">{getUserInitial()}</div>
              <p>
                <strong>Name:</strong> {userData.username}
              </p>
              <p>
                <strong>Email:</strong> {userData.email}
              </p>
            </div>
            <button onClick={handleLogout} className="logout-button">
              Log Out
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default Header;
