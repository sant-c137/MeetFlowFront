import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import EventCard from "./EventCard";
import "./MyEvents.css";
import axios from "axios";

Modal.setAppElement("#root");

const formatGoogleCalendarDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string for Google Calendar:", dateString);
      return "";
    }

    const pad = (num) => (num < 10 ? "0" : "") + num;
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
        date.getUTCDate()
      )}T` +
      `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
        date.getUTCSeconds()
      )}Z`
    );
  } catch (error) {
    console.error(
      "Error formatting date for Google Calendar:",
      dateString,
      error
    );
    return "";
  }
};

const generateGoogleCalendarLink = (eventData) => {
  const {
    title,
    description,
    startTime,
    endTime,
    location,
    attendees = [],
  } = eventData;
  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";

  let url = `${baseUrl}&text=${encodeURIComponent(title || "Event")}`;

  let formattedStartTime = "";
  let formattedEndTime = "";

  if (startTime) {
    formattedStartTime = formatGoogleCalendarDate(startTime);
    if (endTime) {
      formattedEndTime = formatGoogleCalendarDate(endTime);
    } else {
      const startDateObj = new Date(startTime);
      if (!isNaN(startDateObj.getTime())) {
        const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
        formattedEndTime = formatGoogleCalendarDate(endDateObj.toISOString());
      }
    }
  }

  if (formattedStartTime && formattedEndTime) {
    url += `&dates=${formattedStartTime}/${formattedEndTime}`;
  } else if (formattedStartTime) {
    url += `&dates=${formattedStartTime}/${formattedStartTime}`;
  }

  if (description) {
    url += `&details=${encodeURIComponent(description)}`;
  }
  if (location) {
    url += `&location=${encodeURIComponent(location)}`;
  }

  const attendeeEmails = attendees
    .map((att) => att.email)
    .filter((email) => email)
    .join(",");

  if (attendeeEmails) {
    url += `&add=${encodeURIComponent(attendeeEmails)}`;
  }

  return url;
};

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
  const [isSearching, setIsSearching] = useState(false);

  const [createError, setCreateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [googleCalendarLink, setGoogleCalendarLink] = useState("");

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const response = await axios.get("/api/events/");
      setEvents(response.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEventsError(
        err.response?.data?.error || err.message || "Could not load events."
      );
    } finally {
      setIsLoadingEvents(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreateModal = () => {
    setNewEventTitle("");
    setNewEventDescription("");
    setTimeOptions([{ datetime: "" }]);
    setLocationOptions([{ name: "", address: "", details: "" }]);
    setInviteInput("");
    setSearchResults([]);
    setUsersToInvite([]);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleTimeOptionChange = (index, value) => {
    const newTimeOptions = [...timeOptions];
    newTimeOptions[index].datetime = value;
    setTimeOptions(newTimeOptions);
  };
  const addTimeOption = () =>
    setTimeOptions([...timeOptions, { datetime: "" }]);
  const removeTimeOption = (index) => {
    if (timeOptions.length > 1)
      setTimeOptions(timeOptions.filter((_, i) => i !== index));
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
    if (locationOptions.length > 1)
      setLocationOptions(locationOptions.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (inviteInput.trim().length > 1) {
        setIsSearching(true);
        try {
          const response = await axios.get(
            `/api/users/search/?q=${encodeURIComponent(inviteInput)}`
          );
          const currentInvitedIds = usersToInvite.map((u) => u.id);
          setSearchResults(
            response.data.filter((user) => !currentInvitedIds.includes(user.id))
          );
        } catch (error) {
          console.error("Error searching users:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [inviteInput, usersToInvite]);

  const addUserToInviteList = (user) => {
    if (!usersToInvite.find((u) => u.id === user.id)) {
      setUsersToInvite([...usersToInvite, user]);
      setInviteInput("");
      setSearchResults([]);
    }
  };

  const removeUserFromInviteList = (userId) => {
    setUsersToInvite(usersToInvite.filter((u) => u.id !== userId));
  };

  const handleSubmitNewEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      setCreateError("Title is required.");
      return;
    }

    const hasValidTimeOption = timeOptions.some((opt) => opt.datetime);
    if (!hasValidTimeOption) {
      setCreateError("At least one time option with a date is required.");
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const eventResponse = await axios.post("/api/events/", {
        title: newEventTitle,
        description: newEventDescription,
      });
      const createdEvent = eventResponse.data;
      const eventId = createdEvent.id;

      for (const option of timeOptions) {
        if (option.datetime) {
          try {
            await axios.post(`/api/events/${eventId}/time_options/`, {
              datetime: option.datetime,
              start_time: option.datetime,
            });
          } catch (err) {
            console.warn(
              `Failed to add time option:`,
              err.response?.data || err.message
            );
          }
        }
      }

      for (const option of locationOptions) {
        if (option.name && option.address) {
          try {
            await axios.post(
              `/api/events/${eventId}/location_options/`,
              option
            );
          } catch (err) {
            console.warn(
              `Failed to add location option:`,
              err.response?.data || err.message
            );
          }
        }
      }

      for (const userToInvite of usersToInvite) {
        try {
          await axios.post(`/api/events/${eventId}/invite/`, {
            user_id: userToInvite.id,
          });
          console.log(`Invitation sent to ${userToInvite.username}`);
        } catch (err) {
          console.warn(
            `Failed to send invitation to ${userToInvite.username}:`,
            err.response?.data || err.message
          );
        }
      }

      handleCloseCreateModal();
      fetchEvents();
    } catch (err) {
      console.error("Failed to create event or its options/invitations:", err);
      setCreateError(
        err.response?.data?.error || err.message || "Failed to create event."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (event) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
    setIsLoadingDetails(true);
    setDetailError(null);
    setEventDetails(null);
    setGoogleCalendarLink("");

    try {
      const response = await axios.get(`/api/events/${event.id}/`);
      const details = response.data;
      setEventDetails(details);

      if (details) {
        let startTime = null;
        let endTime = null;

        if (details.final_start_time) {
          startTime = details.final_start_time;
          endTime = details.final_end_time || null;
        } else if (details.time_options && details.time_options.length > 0) {
          const firstTimeOption = details.time_options[0];
          startTime = firstTimeOption.start_time || firstTimeOption.datetime;
          endTime = firstTimeOption.end_time || null;
        }

        let locationString = "";
        if (
          details.final_location &&
          typeof details.final_location === "object"
        ) {
          locationString = `${details.final_location.name}, ${details.final_location.address}`;
        } else if (
          details.final_location &&
          typeof details.final_location === "string"
        ) {
          locationString = details.final_location;
        } else if (
          details.location_options &&
          details.location_options.length > 0
        ) {
          const firstLocation = details.location_options[0];
          locationString = `${firstLocation.name}, ${firstLocation.address}`;
          if (firstLocation.details) {
            locationString += ` (${firstLocation.details})`;
          }
        }

        const attendeesList = details.attendees || details.invited_users || [];

        if (startTime) {
          const calendarEventData = {
            title: details.title,
            description: details.description,
            startTime: startTime,
            endTime: endTime,
            location: locationString,
            attendees: attendeesList,
          };
          setGoogleCalendarLink(generateGoogleCalendarLink(calendarEventData));
        } else {
          console.warn(
            "No start time available to generate Google Calendar link for event:",
            details.id
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      setDetailError(
        err.response?.data?.error ||
          err.message ||
          "Could not load event details."
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };
  const handleCloseDetailModal = () => setIsDetailModalOpen(false);

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`/api/events/${eventId}/`);
        handleCloseDetailModal();
        fetchEvents();
      } catch (err) {
        console.error("Failed to delete event:", err);
        setDetailError(
          err.response?.data?.error || err.message || "Could not delete event."
        );
      }
    }
  };

  return (
    <div className="my-events-page-container">
      <div className="my-events-header-bar">
        <h1>My Events</h1>
        <button onClick={handleOpenCreateModal} className="new-event-button">
          New Event
        </button>
      </div>

      {isLoadingEvents && <p className="loading-text">Loading events...</p>}
      {eventsError && <p className="error-text">{eventsError}</p>}
      {!isLoadingEvents && !eventsError && events.length === 0 && (
        <p className="no-events-text">No events yet. Create one!</p>
      )}
      {!isLoadingEvents && !eventsError && events.length > 0 && (
        <div className="event-list-container">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={handleOpenDetailModal}
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
            />
          </div>
          <div className="form-group">
            <label htmlFor="newEventDescription">Description</label>
            <textarea
              id="newEventDescription"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
            />
          </div>

          <fieldset className="form-fieldset">
            <legend>Time Options (at least one required)</legend>
            {timeOptions.map((opt, index) => (
              <div
                key={index}
                className="option-group time-option-group single-datetime"
              >
                <div className="form-group-inline">
                  <label htmlFor={`timeOptionDate-${index}`}>
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id={`timeOptionDate-${index}`}
                    value={opt.datetime}
                    onChange={(e) =>
                      handleTimeOptionChange(index, e.target.value)
                    }
                    required={index === 0 && timeOptions.length === 1}
                  />
                </div>
                {timeOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTimeOption(index)}
                    className="remove-option-btn"
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

          <fieldset className="form-fieldset">
            <legend>Location Options</legend>
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
                  <label htmlFor={`locationDetails-${index}`}>Details</label>
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

          <fieldset className="form-fieldset">
            <legend>Invite Users</legend>
            <div className="form-group">
              <label htmlFor="inviteUserInput">
                Search users (username/email)
              </label>
              <input
                type="text"
                id="inviteUserInput"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Start typing to search..."
              />
              {isSearching && <p className="searching-text">Searching...</p>}
              {searchResults.length > 0 && (
                <ul className="user-search-results">
                  {searchResults.map((user) => (
                    <li key={user.id} onClick={() => addUserToInviteList(user)}>
                      {user.username} ({user.email}){" "}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {usersToInvite.length > 0 && (
              <div className="selected-users-to-invite">
                <p>Users to invite:</p>
                <ul>
                  {usersToInvite.map((user) => (
                    <li key={user.id}>
                      {user.username}
                      <button
                        type="button"
                        onClick={() => removeUserFromInviteList(user.id)}
                        className="remove-user-btn"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>

          {createError && (
            <p className="error-text modal-error">{createError}</p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </Modal>

      {selectedEvent && (
        <Modal
          isOpen={isDetailModalOpen}
          onRequestClose={handleCloseDetailModal}
          contentLabel="Event Details"
          className="modal event-detail-modal"
          overlayClassName="modal-overlay"
        >
          <h2>{selectedEvent.title}</h2>
          {isLoadingDetails && (
            <p className="loading-text">Loading details...</p>
          )}
          {detailError && (
            <p className="error-text modal-error">{detailError}</p>
          )}
          {eventDetails && !isLoadingDetails && (
            <div className="event-detail-content">
              <p>
                <strong>Description:</strong>{" "}
                {eventDetails.description || "N/A"}
              </p>
              <p>
                <strong>Creator:</strong>{" "}
                {eventDetails.creator_username || eventDetails.creator}{" "}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {eventDetails.status_display || eventDetails.status}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(eventDetails.creation_date).toLocaleString()}
              </p>
              <h3>Time Options:</h3>
              {eventDetails.time_options?.length > 0 ? (
                <ul>
                  {eventDetails.time_options.map((opt) => (
                    <li key={opt.id}>
                      {new Date(
                        opt.start_time || opt.datetime
                      ).toLocaleString()}
                      {opt.end_time &&
                        ` to ${new Date(opt.end_time).toLocaleString()}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No time options specified.</p>
              )}
              <h3>Location Options:</h3>
              {eventDetails.location_options?.length > 0 ? (
                <ul>
                  {eventDetails.location_options.map((opt) => (
                    <li key={opt.id}>
                      {opt.name} ({opt.address})
                      {opt.details && <span> - {opt.details}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No location options specified.</p>
              )}

              {googleCalendarLink && (
                <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                  <a
                    href={googleCalendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-primary"
                    style={{ textDecoration: "none", display: "inline-block" }}
                  >
                    Add to Google Calendar
                  </a>
                </div>
              )}

              <div className="modal-actions">
                <button
                  onClick={handleCloseDetailModal}
                  className="button-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteEvent(eventDetails.id)}
                  className="button-danger"
                >
                  Delete Event
                </button>
              </div>
            </div>
          )}
          {!eventDetails && !isLoadingDetails && !detailError && (
            <div className="event-detail-content">
              <p>
                <strong>Description:</strong>{" "}
                {selectedEvent.description || "N/A"}
              </p>
              <div className="modal-actions">
                <button
                  onClick={handleCloseDetailModal}
                  className="button-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default MyEvents;
