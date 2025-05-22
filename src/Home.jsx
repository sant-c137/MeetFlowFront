import { useState } from "react";
import Header from "./Header";
import MyEvents from "./MyEvents";
import InvitedEvents from "./InvitedEvents";

import EventDetailPage from "./EventDetailPage";

import "./Home.css";

const Home = () => {
  const [selectedEventId, setSelectedEventId] = useState(null);

  const handleViewEventDetails = (eventId) => {
    setSelectedEventId(eventId);
    window.scrollTo(0, 0);
  };

  const handleReturnToList = () => {
    setSelectedEventId(null);
  };

  return (
    <>
      <div className="home-wrapper">
        <div className="home-container">
          <Header />

          {selectedEventId ? (
            <EventDetailPage
              eventId={selectedEventId}
              onBackToList={handleReturnToList}
            />
          ) : (
            <div className="events-container">
              <div className="my-events">
                <MyEvents onEventSelect={handleViewEventDetails} />
              </div>
              <div className="invited-events">
                {/* Asumiendo que InvitedEvents también tiene una prop onEventSelect */}
                <InvitedEvents onEventSelect={handleViewEventDetails} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
