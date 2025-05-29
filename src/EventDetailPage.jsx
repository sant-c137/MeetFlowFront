import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EventDetailPage.css";
import VotingBarChart from "./VotingBarChart";

const formatDateTimeShort = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string for display:", dateString);
      return "Invalid Date";
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date for display:", dateString, error);
    return "Error in date";
  }
};

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

      if (details) {
        let startTimeForCalendar = null,
          endTimeForCalendar = null,
          locationStringForCalendar = "";

        if (details.status === "confirmed" && details.final_start_time) {
          startTimeForCalendar = details.final_start_time;
          endTimeForCalendar = details.final_end_time || null;
        } else if (details.time_options?.length > 0) {
          const sortedTimeOptions = [...(details.time_options || [])].sort(
            (a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
          );
          if (
            sortedTimeOptions.length > 0 &&
            sortedTimeOptions[0].vote_count > 0
          ) {
            const chosenTimeOption = sortedTimeOptions[0];
            startTimeForCalendar = chosenTimeOption.start_time;
            endTimeForCalendar = chosenTimeOption.end_time || null;
          } else if (sortedTimeOptions.length > 0) {
            const chosenTimeOption = sortedTimeOptions[0];
            startTimeForCalendar = chosenTimeOption.start_time;
            endTimeForCalendar = chosenTimeOption.end_time || null;
          }
        }

        if (details.status === "confirmed" && details.final_location) {
          locationStringForCalendar =
            typeof details.final_location === "object"
              ? `${details.final_location.name}${
                  details.final_location.address
                    ? `, ${details.final_location.address}`
                    : ""
                }`
              : details.final_location;
        } else if (details.location_options?.length > 0) {
          const sortedLocationOptions = [
            ...(details.location_options || []),
          ].sort(
            (a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0)
          );
          if (
            sortedLocationOptions.length > 0 &&
            sortedLocationOptions[0].vote_count > 0
          ) {
            const chosenLocationOption = sortedLocationOptions[0];
            locationStringForCalendar = `${chosenLocationOption.name}${
              chosenLocationOption.address
                ? `, ${chosenLocationOption.address}`
                : ""
            }`;
            if (chosenLocationOption.details)
              locationStringForCalendar += ` (${chosenLocationOption.details})`;
          } else if (sortedLocationOptions.length > 0) {
            const chosenLocationOption = sortedLocationOptions[0];
            locationStringForCalendar = `${chosenLocationOption.name}${
              chosenLocationOption.address
                ? `, ${chosenLocationOption.address}`
                : ""
            }`;
            if (chosenLocationOption.details)
              locationStringForCalendar += ` (${chosenLocationOption.details})`;
          }
        }

        const attendeesForCalendar =
          details.invitations
            ?.filter(
              (inv) =>
                inv.status === "accepted" && (inv.user_email || inv.email)
            )
            .map((inv) => ({ email: inv.user_email || inv.email })) || [];

        if (startTimeForCalendar) {
          setGoogleCalendarLink(
            generateGoogleCalendarLink({
              title: details.title,
              description: details.description,
              startTime: startTimeForCalendar,
              endTime: endTimeForCalendar,
              location: locationStringForCalendar,
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
    if (!eventId || !eventDetails?.is_creator) return;
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      try {
        setIsLoadingDetails(true);
        await axios.delete(`/api/events/${eventId}/`);
        // alert("Event deleted successfully.");
        if (onBackToList) {
          onBackToList();
        } else {
          navigate("/home");
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "Could not delete event.";
        // alert(`Error deleting event: ${errorMsg}`);
      } finally {
        setIsLoadingDetails(false);
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
      <div className="event-detail-page-container error-text">
        Error: Event ID not specified.
        <button onClick={handleGoBack} className="back-button action-button">
          ← Back
        </button>
      </div>
    );
  }

  if (isLoadingDetails) {
    return (
      <div className="event-detail-page-container loading-text">
        Loading event details...
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="event-detail-page-container error-text">
        Error: {detailError}
        <button onClick={handleGoBack} className="back-button action-button">
          ← Back
        </button>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="event-detail-page-container no-data-text">
        Event data not found or event does not exist.
        <button onClick={handleGoBack} className="back-button action-button">
          ← Back
        </button>
      </div>
    );
  }

  const creatorUsername =
    eventDetails.creator_username || eventDetails.creator || "N/A";
  const isCreator = eventDetails.is_creator === true;

  const timeChartOptions =
    eventDetails.time_options?.map((opt) => ({
      id: `time-opt-${opt.id}`,
      label: `${formatDateTimeShort(opt.start_time)}${
        opt.end_time && opt.end_time !== opt.start_time
          ? ` to ${formatDateTimeShort(opt.end_time)}`
          : ""
      }`,
      vote_count: Number(opt.vote_count) || 0,
      all_votes: opt.all_votes || [],
    })) || [];

  const locationChartOptions =
    eventDetails.location_options?.map((opt) => {
      const fullLabel = `${opt.name}${opt.address ? ` (${opt.address})` : ""}${
        opt.details ? ` - ${opt.details}` : ""
      }`;
      return {
        id: `loc-opt-${opt.id}`,
        label: fullLabel,
        vote_count: Number(opt.vote_count) || 0,
        all_votes: opt.all_votes || [],
        tooltipLabel: fullLabel,
      };
    }) || [];

  const showTimeChart = timeChartOptions.length > 0;

  const showLocationChart =
    locationChartOptions.length > 0 &&
    locationChartOptions.some(
      (opt, idx, arr) =>
        (opt.vote_count !== undefined && opt.vote_count > 0) || arr.length === 1
    );

  return (
    <div className="event-detail-page-container">
      <header className="event-detail-header">
        <div className="header-top-row">
          <h1>{eventDetails.title}</h1>
          <div className="header-actions-primary">
            <button
              onClick={handleGoBack}
              className="back-button action-button"
            >
              ← Back
            </button>
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
          </div>
        </div>
        {eventDetails.description && (
          <p className="event-description-subheader">
            {eventDetails.description}
          </p>
        )}
      </header>

      <main className="event-detail-content-main">
        <div className="main-column left-column">
          <section className="event-info-section column-content-section">
            <h2>Event Details</h2>
            <p>
              <strong>Creator:</strong> {creatorUsername}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`status-badge status-${(
                  eventDetails.status || "undefined"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {eventDetails.status_display || eventDetails.status}
              </span>
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {formatDateTimeShort(eventDetails.creation_date)}
            </p>

            {eventDetails.status === "confirmed" && (
              <>
                {eventDetails.final_start_time && (
                  <p>
                    <strong>Final Time:</strong>{" "}
                    {formatDateTimeShort(eventDetails.final_start_time)}
                    {eventDetails.final_end_time &&
                      eventDetails.final_end_time !==
                        eventDetails.final_start_time &&
                      ` - ${formatDateTimeShort(eventDetails.final_end_time)}`}
                  </p>
                )}
                {eventDetails.final_location && (
                  <p
                    title={
                      typeof eventDetails.final_location === "string"
                        ? eventDetails.final_location
                        : `${eventDetails.final_location.name}${
                            eventDetails.final_location.address
                              ? ` (${eventDetails.final_location.address})`
                              : ""
                          }${
                            eventDetails.final_location.details
                              ? ` - ${eventDetails.final_location.details}`
                              : ""
                          }`
                    }
                    className="final-location-text"
                  >
                    <strong>Final Location:</strong>{" "}
                    {typeof eventDetails.final_location === "string"
                      ? eventDetails.final_location
                      : `${eventDetails.final_location.name}${
                          eventDetails.final_location.address
                            ? ` (${eventDetails.final_location.address})`
                            : ""
                        }`}
                  </p>
                )}
              </>
            )}
          </section>

          <section className="event-attendees-section column-content-section">
            <h2>Attendees / Invited</h2>
            {eventDetails.invitations?.length > 0 ? (
              <ul className="attendees-list">
                {eventDetails.invitations.map((person) => (
                  <li
                    key={`inv-${
                      person.id || person.user_id || person.user_email
                    }`}
                    className="attendee-item"
                  >
                    <span>
                      {person.username || person.user_email || "Guest"}
                    </span>
                    <span
                      className={`status-badge status-${(
                        person.status || "undefined"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {person.status_display || person.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No one has been invited or RSVP'd yet.</p>
            )}
          </section>
        </div>

        <div className="main-column right-column">
          <section className="event-options-section column-content-section">
            <h2>Proposed Options</h2>

            {eventDetails.time_options?.length > 0 ||
            eventDetails.location_options?.length > 0 ? (
              <>
                {eventDetails.time_options?.length > 0 && (
                  <>
                    <h3>Time Options:</h3>
                    {showTimeChart ? (
                      <VotingBarChart
                        optionsData={timeChartOptions}
                        optionTypeLabel="Time Option"
                      />
                    ) : (
                      <ul className="options-list-simple">
                        {eventDetails.time_options.map((opt) => (
                          <li
                            key={`time-opt-${opt.id}`}
                            title={`${formatDateTimeShort(opt.start_time)}${
                              opt.end_time && opt.end_time !== opt.start_time
                                ? ` to ${formatDateTimeShort(opt.end_time)}`
                                : ""
                            }`}
                          >
                            {formatDateTimeShort(opt.start_time)}
                            {opt.end_time &&
                              opt.end_time !== opt.start_time &&
                              ` to ${formatDateTimeShort(opt.end_time)}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {eventDetails.location_options?.length > 0 && (
                  <>
                    <h3>Location Options:</h3>
                    {showLocationChart ? (
                      <VotingBarChart
                        optionsData={locationChartOptions.map((opt) => ({
                          ...opt,
                        }))}
                        optionTypeLabel="Location Option"
                      />
                    ) : (
                      <ul className="options-list-simple">
                        {eventDetails.location_options.map((opt) => {
                          const fullDisplayLocation = `${opt.name}${
                            opt.address ? ` (${opt.address})` : ""
                          }${opt.details ? ` - ${opt.details}` : ""}`;
                          return (
                            <li
                              key={`loc-opt-${opt.id}`}
                              title={fullDisplayLocation}
                            >
                              {fullDisplayLocation}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </>
            ) : (
              <p>No options proposed for voting yet.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
