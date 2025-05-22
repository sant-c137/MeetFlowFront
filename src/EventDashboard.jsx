import MyEvents from "./MyEvents";
import InvitedEvents from "./InvitedEvents";

const EventDashboard = () => {
  return (
    <div className="events-container">
      <div className="my-events">
        <MyEvents />
      </div>
      <div className="invited-events">
        <InvitedEvents />
      </div>
    </div>
  );
};

export default EventDashboard;
