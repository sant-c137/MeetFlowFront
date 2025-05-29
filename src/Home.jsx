import { useState } from "react";
import Header from "./Header";
import MyEvents from "./MyEvents";
import InvitedEvents from "./InvitedEvents";
import EventDetailPage from "./EventDetailPage";
import "./Home.css";

const Home = () => {
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [refreshMyEventsTrigger, setRefreshMyEventsTrigger] = useState(0);
  const handleViewEventDetails = (eventId) => {
    setSelectedEventId(eventId);
    window.scrollTo(0, 0);
  };

  const handleReturnToList = () => {
    setSelectedEventId(null);
  };

  const handleInvitationAccepted = () => {
    setRefreshMyEventsTrigger((prevTrigger) => prevTrigger + 1);
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
                <MyEvents
                  onEventSelect={handleViewEventDetails}
                  refreshTrigger={refreshMyEventsTrigger}
                />
              </div>
              <div className="invited-events">
                <InvitedEvents
                  onEventSelect={handleViewEventDetails}
                  onInvitationAccepted={handleInvitationAccepted}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
