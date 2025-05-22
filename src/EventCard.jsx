import "./EventCard.css";

const EventCard = ({ event, onClick }) => {
  let displayDate = null;
  let displayMonth = "";
  let displayDay = "";

  if (event && event.time_options && event.time_options.length > 0) {
    const firstTimeOption = event.time_options[0];

    const dateString = firstTimeOption.datetime || firstTimeOption.start_time;

    if (dateString) {
      try {
        const parsedDate = new Date(dateString);

        if (!isNaN(parsedDate.getTime())) {
          displayDate = parsedDate;
        } else {
          console.warn(
            "Could not parse time_option date (invalid date object):",
            dateString
          );
        }
      } catch (e) {
        console.warn("Error parsing time_option date:", dateString, e);
      }
    }
  }

  if (!displayDate && event && event.creation_date) {
    try {
      const parsedDate = new Date(event.creation_date);

      if (!isNaN(parsedDate.getTime())) {
        displayDate = parsedDate;
      } else {
        console.warn(
          "Could not parse creation_date (invalid date object):",
          event.creation_date
        );
      }
    } catch (e) {
      console.warn("Error parsing creation_date:", event.creation_date, e);
    }
  }

  if (displayDate) {
    displayMonth = displayDate.toLocaleString("es-ES", { month: "short" });
    displayDay = displayDate.getDate();
  } else {
    displayMonth =
      event && event.title ? event.title.charAt(0).toUpperCase() : "Ev";
    displayDay = event && event.title ? "" : "??";
  }

  return (
    <div className="event-card" onClick={() => onClick(event)}>
      <div className="event-card-date">
        <span className="month">{displayMonth}</span>
        <span className="day">{displayDay}</span>
      </div>
      <div className="event-card-info">
        <h3 className="event-title">{event?.title || "Evento sin título"}</h3>
        <p className="event-description">
          {event?.description || "Sin descripción"}
        </p>
      </div>
    </div>
  );
};

export default EventCard;
