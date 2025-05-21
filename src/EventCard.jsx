import "./EventCard.css";

const EventCard = ({ event, onClick }) => {
  let displayDate = null;
  let displayMonth = "";
  let displayDay = "";

  if (event.time_options && event.time_options.length > 0) {
    const firstTimeOption = event.time_options[0];

    const dateString = firstTimeOption.start_time;

    if (dateString) {
      try {
        displayDate = new Date(dateString);
      } catch (e) {
        console.warn("Could not parse time_option date:", dateString);
      }
    }
  }

  if (!displayDate && event.creation_date) {
    try {
      displayDate = new Date(event.creation_date);
    } catch (e) {
      console.warn("Could not parse creation_date:", event.creation_date);
    }
  }

  if (displayDate && !isNaN(displayDate)) {
    displayMonth = displayDate.toLocaleString("default", { month: "short" });
    displayDay = displayDate.getDate();
  } else {
    displayMonth = event.title ? event.title.charAt(0).toUpperCase() : "Ev";
    displayDay = "";
  }

  return (
    <div className="event-card" onClick={() => onClick(event)}>
      <div className="event-card-date">
        <span className="month">{displayMonth}</span>
        <span className="day">{displayDay}</span>
      </div>
      <div className="event-card-info">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">
          {event.description || "No description"}
        </p>
      </div>
    </div>
  );
};

export default EventCard;
