import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";
import EventCard from "./EventCard";
import "./MyEvents.css";
import axios from "axios";

Modal.setAppElement("#root");

const MyEvents = ({ onEventSelect, refreshTrigger }) => {
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [timeOptions, setTimeOptions] = useState([{ datetime: "" }]);
  const [locationOptions, setLocationOptions] = useState([
    { name: "", address: "", details: "" },
  ]);
  const [inviteInput, setInviteInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [usersToInvite, setUsersToInvite] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [createEventError, setCreateEventError] = useState(null);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const resetCreateModalForm = () => {
    setNewEventTitle("");
    setNewEventDescription("");
    setTimeOptions([{ datetime: "" }]);
    setLocationOptions([{ name: "", address: "", details: "" }]);
    setInviteInput("");
    setSearchResults([]);
    setUsersToInvite([]);
    setCreateEventError(null);
  };

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const response = await axios.get("/api/events/", {
        withCredentials: true,
      });
      setEvents(response.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEventsError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "Could not load your events."
      );
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const handleOpenCreateModal = () => {
    resetCreateModalForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleTimeOptionChange = (index, value) => {
    const newTimeOptions = [...timeOptions];
    newTimeOptions[index].datetime = value;
    setTimeOptions(newTimeOptions);
  };
  const addTimeOption = () =>
    setTimeOptions([...timeOptions, { datetime: "" }]);
  const removeTimeOption = (index) => {
    if (timeOptions.length > 1) {
      setTimeOptions(timeOptions.filter((_, i) => i !== index));
    }
  };

  const handleLocationOptionChange = (index, field, value) => {
    const newLocationOptions = [...locationOptions];
    newLocationOptions[index][field] = value;
    setLocationOptions(newLocationOptions);
  };
  const addLocationOption = () =>
    setLocationOptions([
      ...locationOptions,
      { name: "", address: "", details: "" },
    ]);
  const removeLocationOption = (index) => {
    if (locationOptions.length > 1) {
      setLocationOptions(locationOptions.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (inviteInput.trim().length > 1) {
        setIsSearchingUsers(true);
        setSearchResults([]);
        try {
          const response = await axios.get(
            `/api/users/search/?q=${encodeURIComponent(inviteInput)}`,
            { withCredentials: true }
          );
          const currentInvitedUserIds = usersToInvite.map((user) => user.id);
          setSearchResults(
            response.data.filter(
              (user) => !currentInvitedUserIds.includes(user.id)
            )
          );
        } catch (error) {
          console.error("Error searching users:", error);
          setSearchResults([]);
        } finally {
          setIsSearchingUsers(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inviteInput, usersToInvite]);

  const addUserToInviteList = (user) => {
    if (!usersToInvite.find((u) => u.id === user.id)) {
      setUsersToInvite([...usersToInvite, user]);
    }
    setInviteInput("");
    setSearchResults([]);
  };

  const removeUserFromInviteList = (userIdToRemove) => {
    setUsersToInvite(
      usersToInvite.filter((user) => user.id !== userIdToRemove)
    );
  };

  const handleSubmitNewEvent = async (e) => {
    e.preventDefault();
    setCreateEventError(null);

    if (!newEventTitle.trim()) {
      setCreateEventError("Title is required.");
      return;
    }

    const validTimeOptions = timeOptions.filter(
      (opt) => opt.datetime && opt.datetime.trim() !== ""
    );
    if (validTimeOptions.length === 0) {
      setCreateEventError(
        "At least one valid time option with a date and time is required."
      );
      return;
    }

    const validLocationOptions = locationOptions.filter((opt) => {
      const hasName = opt.name && opt.name.trim() !== "";
      const hasAddress = opt.address && opt.address.trim() !== "";
      if (hasName || hasAddress) {
        return hasName && hasAddress;
      }
      return true;
    });

    if (
      !validLocationOptions.every(
        (opt) =>
          (opt.name && opt.address) ||
          (!opt.name && !opt.address && !opt.details)
      )
    ) {
      setCreateEventError(
        "If providing a location option, both name and address are required."
      );
      return;
    }
    const locationsToSend = locationOptions.filter(
      (opt) => opt.name && opt.address
    );

    setIsSubmittingEvent(true);

    try {
      const eventResponse = await axios.post(
        "/api/events/",
        {
          title: newEventTitle,
          description: newEventDescription,
        },
        { withCredentials: true }
      );

      const createdEvent = eventResponse.data;
      const eventId = createdEvent.id;

      const promises = [];

      validTimeOptions.forEach((option) => {
        promises.push(
          axios
            .post(
              `/api/events/${eventId}/time_options/`,
              {
                start_time: option.datetime,
                end_time: option.datetime,
              },
              { withCredentials: true }
            )
            .catch((err) => {
              console.warn(
                `Failed to add time option: ${option.datetime}`,
                err.response?.data || err.message
              );
            })
        );
      });

      locationsToSend.forEach((option) => {
        promises.push(
          axios
            .post(`/api/events/${eventId}/location_options/`, option, {
              withCredentials: true,
            })
            .catch((err) => {
              console.warn(
                `Failed to add location option: ${option.name}`,
                err.response?.data || err.message
              );
            })
        );
      });

      usersToInvite.forEach((user) => {
        promises.push(
          axios
            .post(
              `/api/events/${eventId}/invite/`,
              {
                user_id: user.id,
              },
              { withCredentials: true }
            )
            .catch((err) => {
              console.warn(
                `Failed to send invitation to ${user.username || user.email}:`,
                err.response?.data || err.message
              );
            })
        );
      });

      await Promise.all(promises);

      alert("Event created successfully!");
      handleCloseCreateModal();
      fetchEvents();
      resetCreateModalForm();
    } catch (err) {
      console.error("Failed to create event or its associated data:", err);
      setCreateEventError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "An unexpected error occurred while creating the event."
      );
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleEventCardClick = (eventClicked) => {
    if (onEventSelect) {
      onEventSelect(eventClicked.id);
    } else {
      console.warn("onEventSelect prop not provided to MyEvents component");
    }
  };

  return (
    <div className="my-events-page-container">
      <div className="my-events-header-bar">
        <h1>My Events</h1>
        <button onClick={handleOpenCreateModal} className="new-event-button">
          + New Event
        </button>
      </div>

      {isLoadingEvents && (
        <p className="loading-text">Loading your events...</p>
      )}
      {eventsError && <p className="error-text">{eventsError}</p>}
      {!isLoadingEvents && !eventsError && events.length === 0 && (
        <p className="no-events-text">
          You haven{`'`}t created any events yet. Create one!
        </p>
      )}
      {!isLoadingEvents && !eventsError && events.length > 0 && (
        <div className="event-list-container">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => handleEventCardClick(event)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={handleCloseCreateModal}
        contentLabel="Create New Event"
        className="modal event-creation-modal"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={!isSubmittingEvent}
        shouldCloseOnEsc={!isSubmittingEvent}
      >
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmitNewEvent} className="modal-form">
          <div className="form-group">
            <label htmlFor="newEventTitle">Title *</label>
            <input
              type="text"
              id="newEventTitle"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
              disabled={isSubmittingEvent}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newEventDescription">Description</label>
            <textarea
              id="newEventDescription"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              disabled={isSubmittingEvent}
              rows="3"
            />
          </div>

          <fieldset className="form-fieldset" disabled={isSubmittingEvent}>
            <legend>
              Time Options * <small>(At least one required)</small>
            </legend>
            {timeOptions.map((opt, index) => (
              <div
                key={index}
                className="option-group time-option-group single-datetime"
              >
                <div className="form-group-inline">
                  <label htmlFor={`timeOptionDateTime-${index}`}>
                    Date & Time
                  </label>{" "}
                  <input
                    type="datetime-local"
                    id={`timeOptionDateTime-${index}`}
                    value={opt.datetime}
                    onChange={(e) =>
                      handleTimeOptionChange(index, e.target.value)
                    }
                  />
                </div>
                {timeOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeOption(index)}
                    className="remove-option-btn"
                    aria-label="Remove time option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTimeOption}
              className="add-option-btn"
            >
              + Add Time Option
            </button>
          </fieldset>

          <fieldset className="form-fieldset" disabled={isSubmittingEvent}>
            <legend>
              Location Options <small>(Name & Address if provided)</small>
            </legend>
            {locationOptions.map((opt, index) => (
              <div key={index} className="option-group location-option-group">
                <div className="form-group">
                  <label htmlFor={`locationName-${index}`}>Name</label>
                  <input
                    type="text"
                    id={`locationName-${index}`}
                    value={opt.name}
                    onChange={(e) =>
                      handleLocationOptionChange(index, "name", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`locationAddress-${index}`}>Address</label>
                  <input
                    type="text"
                    id={`locationAddress-${index}`}
                    value={opt.address}
                    onChange={(e) =>
                      handleLocationOptionChange(
                        index,
                        "address",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor={`locationDetails-${index}`}>
                    Details (e.g., room, floor)
                  </label>
                  <input
                    type="text"
                    id={`locationDetails-${index}`}
                    value={opt.details}
                    onChange={(e) =>
                      handleLocationOptionChange(
                        index,
                        "details",
                        e.target.value
                      )
                    }
                  />
                </div>
                {locationOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocationOption(index)}
                    className="remove-option-btn"
                    aria-label="Remove location option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLocationOption}
              className="add-option-btn"
            >
              + Add Location Option
            </button>
          </fieldset>

          <fieldset className="form-fieldset" disabled={isSubmittingEvent}>
            <legend>Invite Users</legend>
            <div className="form-group">
              <label htmlFor="inviteUserInput">
                Search users (by username or email)
              </label>
              <input
                type="text"
                id="inviteUserInput"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Start typing to search..."
                disabled={isSubmittingEvent}
              />
              {isSearchingUsers && (
                <p className="searching-text small-text">Searching...</p>
              )}
              {searchResults.length > 0 && (
                <ul className="user-search-results">
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      onClick={() =>
                        !isSubmittingEvent && addUserToInviteList(user)
                      }
                      tabIndex={0}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        !isSubmittingEvent &&
                        addUserToInviteList(user)
                      }
                    >
                      {user.username} ({user.email})
                    </li>
                  ))}
                </ul>
              )}
              {searchResults.length === 0 &&
                inviteInput.trim().length > 1 &&
                !isSearchingUsers && (
                  <p className="small-text">
                    No users found matching "{inviteInput}".
                  </p>
                )}
            </div>
            {usersToInvite.length > 0 && (
              <div className="selected-users-to-invite">
                <p>
                  <strong>Users to invite:</strong>
                </p>
                <ul>
                  {usersToInvite.map((user) => (
                    <li key={user.id}>
                      {user.username || user.email}
                      <button
                        type="button"
                        onClick={() =>
                          !isSubmittingEvent &&
                          removeUserFromInviteList(user.id)
                        }
                        className="remove-user-btn"
                        aria-label={`Remove ${
                          user.username || user.email
                        } from invite list`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>

          {createEventError && (
            <p className="error-text modal-error">{createEventError}</p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="button-secondary"
              disabled={isSubmittingEvent}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={isSubmittingEvent}
            >
              {isSubmittingEvent ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyEvents;
