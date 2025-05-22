import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EventDetailPage.css";

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
    if (endTime && endTime !== startTime) {
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

  if (description) url += `&details=${encodeURIComponent(description)}`;
  if (location) url += `&location=${encodeURIComponent(location)}`;

  const attendeeEmails = attendees
    .map((att) => att.email)
    .filter((email) => email)
    .join(",");
  if (attendeeEmails) url += `&add=${encodeURIComponent(attendeeEmails)}`;
  return url;
};

const EventDetailPage = ({ eventId: propEventId, onBackToList }) => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  const eventId = propEventId || paramEventId;

  const [eventDetails, setEventDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [detailError, setDetailError] = useState(null);
  const [googleCalendarLink, setGoogleCalendarLink] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      setIsLoadingDetails(false);
      setDetailError("Event ID is not available.");
      setEventDetails(null);
      return;
    }
    setIsLoadingDetails(true);
    setDetailError(null);
    setGoogleCalendarLink("");

    try {
      const response = await axios.get(`/api/events/${eventId}/`);
      const details = response.data;
      setEventDetails(details);

      setIsCreator(details.is_creator === true);

      if (details) {
        let startTime = null,
          endTime = null,
          locationString = "";

        if (details.final_start_time) {
          startTime = details.final_start_time;
          endTime = details.final_end_time || null;
        } else if (details.time_options?.length > 0) {
          const chosenTimeOption = details.is_creator
            ? details.time_options.sort(
                (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
              )[0] || details.time_options[0]
            : details.time_options[0];
          startTime = chosenTimeOption.start_time;
          endTime = chosenTimeOption.end_time || null;
        }

        if (details.final_location) {
          locationString =
            typeof details.final_location === "object"
              ? `${details.final_location.name}, ${details.final_location.address}`
              : details.final_location;
        } else if (details.location_options?.length > 0) {
          const chosenLocationOption = details.is_creator
            ? details.location_options.sort(
                (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
              )[0] || details.location_options[0]
            : details.location_options[0];
          locationString = `${chosenLocationOption.name}, ${chosenLocationOption.address}`;
          if (chosenLocationOption.details)
            locationString += ` (${chosenLocationOption.details})`;
        }

        const attendeesForCalendar =
          details.invitations
            ?.filter(
              (inv) =>
                inv.status === "accepted" && (inv.user_email || inv.email)
            )
            .map((inv) => ({ email: inv.user_email || inv.email })) || [];

        if (startTime) {
          setGoogleCalendarLink(
            generateGoogleCalendarLink({
              title: details.title,
              description: details.description,
              startTime,
              endTime,
              location: locationString,
              attendees: attendeesForCalendar,
            })
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Could not load event details.";
      setDetailError(errorMsg);
      if (err.response?.status === 404) {
        setDetailError("Event not found.");
        setEventDetails(null);
      }
    } finally {
      setIsLoadingDetails(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, fetchEventDetails]);

  const handleDeleteEvent = async () => {
    if (!eventId || !isCreator) return;
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`/api/events/${eventId}/`);
        alert("Event deleted successfully.");
        if (onBackToList) {
          onBackToList();
        } else {
          navigate("/my-events");
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "Could not delete event.";
        alert(`Error deleting event: ${errorMsg}`);
      }
    }
  };

  const handleGoBack = () => {
    if (onBackToList) {
      onBackToList();
    } else {
      navigate(-1);
    }
  };

  if (!eventId && !isLoadingDetails) {
    return (
      <div className="event-detail-page error-text">
        Error: Event ID not specified.
        <button onClick={handleGoBack} className="back-button">
          ← Back
        </button>
      </div>
    );
  }

  if (isLoadingDetails) {
    return (
      <div className="event-detail-page loading-text">
        Loading event details...
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="event-detail-page error-text">
        Error: {detailError}{" "}
        <button onClick={handleGoBack} className="back-button">
          ← Back
        </button>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="event-detail-page no-data-text">
        No event data found or event does not exist.{" "}
        <button onClick={handleGoBack} className="back-button">
          ← Back
        </button>
      </div>
    );
  }

  const creatorUsername = eventDetails.creator_username || "N/A";

  return (
    <div className="event-detail-page-container">
      <div className="event-detail-header">
        <h1>{eventDetails.title}</h1>
        <button onClick={handleGoBack} className="back-button">
          ← Back
        </button>
      </div>

      <div className="event-detail-content">
        <section className="event-info-section">
          <h2>Event Information</h2>
          <p>
            <strong>Description:</strong> {eventDetails.description || "N/A"}
          </p>
          <p>
            <strong>Creator:</strong> {creatorUsername}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={`status-badge status-${eventDetails.status}`}>
              {eventDetails.status_display || eventDetails.status || "N/A"}
            </span>
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(eventDetails.creation_date).toLocaleString()}
          </p>
          {eventDetails.final_start_time && (
            <p>
              <strong>Final Time:</strong>{" "}
              {new Date(eventDetails.final_start_time).toLocaleString()}
              {eventDetails.final_end_time &&
                eventDetails.final_end_time !== eventDetails.final_start_time &&
                ` - ${new Date(eventDetails.final_end_time).toLocaleString()}`}
            </p>
          )}
          {eventDetails.final_location && (
            <p>
              <strong>Final Location:</strong>{" "}
              {typeof eventDetails.final_location === "string"
                ? eventDetails.final_location
                : `${eventDetails.final_location.name} (${eventDetails.final_location.address})`}
            </p>
          )}
        </section>

        <section className="event-options-section">
          <h2>Proposed Options</h2>
          <h3>Time Options:</h3>
          {eventDetails.time_options?.length > 0 ? (
            <ul className="options-list">
              {eventDetails.time_options.map((opt) => (
                <li key={`time-opt-${opt.id}`} className="option-item">
                  <div className="option-details">
                    {new Date(opt.start_time).toLocaleString()}
                    {opt.end_time &&
                      opt.end_time !== opt.start_time &&
                      ` to ${new Date(opt.end_time).toLocaleString()}`}
                  </div>

                  {isCreator && opt.all_votes && (
                    <div className="vote-summary-for-option">
                      <strong>Votes ({opt.vote_count || 0}):</strong>
                      {opt.all_votes.length > 0 ? (
                        <ul className="vote-list">
                          {opt.all_votes.map((vote) => (
                            <li key={`tv-${opt.id}-${vote.user_id}`}>
                              {vote.username}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="no-votes-text"> No votes yet.</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No time options proposed.</p>
          )}

          <h3>Location Options:</h3>
          {eventDetails.location_options?.length > 0 ? (
            <ul className="options-list">
              {eventDetails.location_options.map((opt) => (
                <li key={`loc-opt-${opt.id}`} className="option-item">
                  <div className="option-details">
                    {opt.name} ({opt.address})
                    {opt.details && <span> - {opt.details}</span>}
                  </div>

                  {isCreator && opt.all_votes && (
                    <div className="vote-summary-for-option">
                      <strong>Votes ({opt.vote_count || 0}):</strong>
                      {opt.all_votes.length > 0 ? (
                        <ul className="vote-list">
                          {opt.all_votes.map((vote) => (
                            <li key={`lv-${opt.id}-${vote.user_id}`}>
                              {vote.username}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="no-votes-text"> No votes yet.</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No location options proposed.</p>
          )}
        </section>

        <section className="event-attendees-section">
          <h2>Attendees / Invited</h2>
          {eventDetails.invitations?.length > 0 ? (
            <ul className="attendees-list">
              {eventDetails.invitations.map((person) => (
                <li key={`inv-${person.id}`} className="attendee-item">
                  {person.username}{" "}
                  <span className={`status-badge status-${person.status}`}>
                    ({person.status_display})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No one has been invited or RSVP'd yet.</p>
          )}
        </section>

        <div className="event-actions">
          {googleCalendarLink && (
            <a
              href={googleCalendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary action-button"
            >
              Add to Google Calendar
            </a>
          )}
          {isCreator && (
            <button
              onClick={handleDeleteEvent}
              className="button-danger action-button"
            >
              Delete Event
            </button>
          )}
          {/* Podrías añadir un botón de "Edit Event" si isCreator es true, que navegue a un formulario de edición */}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
