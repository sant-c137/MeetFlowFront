import React, { useState, useEffect } from "react";
import axios from "axios";
import EventCard from "./EventCard";
import Modal from "react-modal";
import "./InvitedEvents.css";

const InvitedEvents = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseStatus, setResponseStatus] = useState("");

  const fetchInvitedEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/my_invitations/");
      setInvitations(response.data || []);
    } catch (err) {
      console.error("Failed to fetch invited events:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Could not load your invitations."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitedEvents();
  }, []);

  const handleOpenResponseModal = (invitation) => {
    setSelectedInvitation(invitation);
    setResponseStatus(invitation.status);
    setIsResponseModalOpen(true);
  };

  const handleCloseResponseModal = () => {
    setIsResponseModalOpen(false);
    setSelectedInvitation(null);
    setResponseStatus("");
  };

  const handleRespondToInvitation = async (e) => {
    e.preventDefault();
    if (!selectedInvitation || !responseStatus) return;

    try {
      await axios.put(`/api/invitations/${selectedInvitation.id}/respond/`, {
        status: responseStatus,
      });

      setInvitations((prevInvites) =>
        prevInvites.map((inv) =>
          inv.id === selectedInvitation.id
            ? {
                ...inv,
                status: responseStatus,
                status_display: `${responseStatus
                  .charAt(0)
                  .toUpperCase()}${responseStatus.slice(1)}`,
              }
            : inv
        )
      );
      handleCloseResponseModal();
    } catch (err) {
      console.error("Failed to respond to invitation:", err);

      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleViewEventDetails = (event) => {
    console.log("View event details:", event);
  };

  if (isLoading)
    return <p className="loading-text">Loading your invitations...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="invited-events-container">
      <h2>Events You're Invited To</h2>

      <div className="invited-events-wrapper">
        {invitations.length === 0 ? (
          <p className="no-invitations-text">
            You have no pending event invitations.
          </p>
        ) : (
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`invitation-item status-${invitation.status}`}
              >
                <EventCard
                  event={invitation.event}
                  onClick={() => handleViewEventDetails(invitation.event)}
                />
                <div className="invitation-info">
                  <p>
                    Invited by:{" "}
                    <strong>{invitation.event.creator_username}</strong>
                  </p>
                  <p>
                    Your Status:{" "}
                    <strong
                      className={`status-badge status-${invitation.status}`}
                    >
                      {invitation.status_display}
                    </strong>
                  </p>
                  {invitation.status === "pending" ||
                  invitation.status === "tentative" ? (
                    <button
                      onClick={() => handleOpenResponseModal(invitation)}
                      className="respond-button"
                    >
                      Respond
                    </button>
                  ) : (
                    <span className="response-recorded">Response recorded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInvitation && (
        <Modal
          isOpen={isResponseModalOpen}
          onRequestClose={handleCloseResponseModal}
          contentLabel="Respond to Invitation"
          className="modal response-modal"
          overlayClassName="modal-overlay"
          appElement={document.getElementById("root") || undefined}
        >
          <h2>Respond to: {selectedInvitation.event.title}</h2>
          <form onSubmit={handleRespondToInvitation} className="modal-form">
            <p>Choose your response:</p>
            <div className="form-group radio-group">
              <label>
                <input
                  type="radio"
                  name="responseStatus"
                  value="accepted"
                  checked={responseStatus === "accepted"}
                  onChange={(e) => setResponseStatus(e.target.value)}
                />{" "}
                Accept
              </label>
              <label>
                <input
                  type="radio"
                  name="responseStatus"
                  value="declined"
                  checked={responseStatus === "declined"}
                  onChange={(e) => setResponseStatus(e.target.value)}
                />{" "}
                Decline
              </label>
              <label>
                <input
                  type="radio"
                  name="responseStatus"
                  value="tentative"
                  checked={responseStatus === "tentative"}
                  onChange={(e) => setResponseStatus(e.target.value)}
                />{" "}
                Tentative
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleCloseResponseModal}
                className="button-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="button-primary">
                Submit Response
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InvitedEvents;
