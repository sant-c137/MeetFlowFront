import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EventCard from "./EventCard";
import Modal from "react-modal";
import "./InvitedEvents.css";

const InvitedEvents = ({ onEventSelect, onInvitationAccepted }) => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [currentProcessingInvitation, setCurrentProcessingInvitation] =
    useState(null);
  const [currentResponseStatus, setCurrentResponseStatus] = useState("");

  const [selectedTimeOptionId, setSelectedTimeOptionId] = useState(null);
  const [selectedLocationOptionId, setSelectedLocationOptionId] =
    useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const VOTE_PREFERENCE_IF_CHECKED = 5;

  const fetchInvitedEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/my_invitations/", {
        withCredentials: true,
      });
      setInvitations(response.data || []);
    } catch (err) {
      console.error("Failed to fetch invited events:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Could not load your invitations."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitedEvents();
  }, [fetchInvitedEvents]);

  const handleOpenVoteModal = (invitation) => {
    setCurrentProcessingInvitation(invitation);
    setCurrentResponseStatus(
      invitation.status === "pending" ? "" : invitation.status
    );

    let initialTimeId = null;
    invitation.event.time_options?.find((opt) => {
      if (opt.user_vote === VOTE_PREFERENCE_IF_CHECKED) {
        initialTimeId = opt.id;
        return true;
      }
      return false;
    });
    setSelectedTimeOptionId(initialTimeId);

    let initialLocationId = null;
    invitation.event.location_options?.find((opt) => {
      if (opt.user_vote === VOTE_PREFERENCE_IF_CHECKED) {
        initialLocationId = opt.id;
        return true;
      }
      return false;
    });
    setSelectedLocationOptionId(initialLocationId);

    setIsVoteModalOpen(true);
  };

  const handleCloseVoteModal = () => {
    setIsVoteModalOpen(false);
    setCurrentProcessingInvitation(null);
    setCurrentResponseStatus("");
    setSelectedTimeOptionId(null);
    setSelectedLocationOptionId(null);
    setIsSubmitting(false);
  };

  const handleTimeOptionChange = (optionId) => {
    setSelectedTimeOptionId(optionId);
  };

  const handleLocationOptionChange = (optionId) => {
    setSelectedLocationOptionId(optionId);
  };

  const handleSubmitResponseAndVotes = async (e) => {
    e.preventDefault();
    if (!currentProcessingInvitation || !currentResponseStatus) {
      // alert("Please select a response status (Accept, Decline, or Tentative).");
      return;
    }
    setIsSubmitting(true);

    const { id: invitationId, event } = currentProcessingInvitation;

    try {
      await axios.put(
        `/api/invitations/${invitationId}/respond/`,
        {
          status: currentResponseStatus,
        },
        { withCredentials: true }
      );

      const votePromises = [];
      if (
        currentResponseStatus === "accepted" ||
        currentResponseStatus === "tentative"
      ) {
        if (selectedTimeOptionId) {
          votePromises.push(
            axios.post(
              `/api/time_options/${selectedTimeOptionId}/vote/`,
              {
                preference: VOTE_PREFERENCE_IF_CHECKED,
              },
              { withCredentials: true }
            )
          );
        }

        if (selectedLocationOptionId) {
          votePromises.push(
            axios.post(
              `/api/location_options/${selectedLocationOptionId}/vote/`,
              {
                preference: VOTE_PREFERENCE_IF_CHECKED,
              },
              { withCredentials: true }
            )
          );
        }
      }

      if (votePromises.length > 0) {
        await Promise.all(votePromises);
      }
      if (onInvitationAccepted) {
        onInvitationAccepted();
      }

      fetchInvitedEvents();
      handleCloseVoteModal();
    } catch (err) {
      console.error("Failed to submit response and votes:", err);
      let errorMessage = "An error occurred during submission.";
      if (err.response && err.response.data) {
        errorMessage =
          err.response.data.error ||
          err.response.data.detail ||
          (typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data));
      } else if (err.message) {
        errorMessage = err.message;
      }
      // alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
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
                className={`invitation-item status-${invitation.status.toLowerCase()}`}
              >
                <EventCard
                  event={invitation.event}
                  onClick={
                    onEventSelect
                      ? () => onEventSelect(invitation.event.id)
                      : undefined
                  }
                />
                <div className="invitation-info">
                  <p>
                    Invited by:{" "}
                    <strong>
                      {invitation.event.creator_username || "N/A"}
                    </strong>
                  </p>
                  <p>
                    Your Status:{" "}
                    <strong
                      className={`status-badge status-${invitation.status.toLowerCase()}`}
                    >
                      {invitation.status_display || invitation.status}
                    </strong>
                  </p>

                  <button
                    onClick={() => handleOpenVoteModal(invitation)}
                    className="respond-vote-button"
                  >
                    {invitation.status === "pending"
                      ? "Respond & Vote"
                      : "Update Response & Votes"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentProcessingInvitation && (
        <Modal
          isOpen={isVoteModalOpen}
          onRequestClose={!isSubmitting ? handleCloseVoteModal : undefined}
          shouldCloseOnOverlayClick={!isSubmitting}
          shouldCloseOnEsc={!isSubmitting}
          contentLabel="Respond to Invitation and Vote"
          className="modal vote-modal"
          overlayClassName="modal-overlay"
          appElement={document.getElementById("root") || undefined}
        >
          <div className="modal-header">
            <h2>{currentProcessingInvitation.event.title}</h2>
          </div>

          <form
            onSubmit={handleSubmitResponseAndVotes}
            className="modal-form modal-body"
          >
            <fieldset className="form-fieldset" disabled={isSubmitting}>
              <legend>Your Response *</legend>
              <div className="form-group radio-group">
                {["accepted", "declined", "tentative"].map((statusValue) => (
                  <label key={statusValue} className="radio-label">
                    <input
                      type="radio"
                      name="responseStatus"
                      value={statusValue}
                      checked={currentResponseStatus === statusValue}
                      onChange={(e) => setCurrentResponseStatus(e.target.value)}
                      required
                    />{" "}
                    {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                  </label>
                ))}
              </div>
            </fieldset>

            {(currentResponseStatus === "accepted" ||
              currentResponseStatus === "tentative") && (
              <>
                <fieldset
                  className="form-fieldset vote-options-group"
                  disabled={isSubmitting}
                >
                  <legend>Preferred Time Option</legend>
                  {currentProcessingInvitation.event.time_options?.length >
                  0 ? (
                    currentProcessingInvitation.event.time_options.map(
                      (opt) => (
                        <div
                          key={`time-${opt.id}`}
                          className="vote-option-item"
                        >
                          <label
                            htmlFor={`time-opt-${opt.id}`}
                            className="radio-label"
                          >
                            <input
                              type="radio"
                              name={`timeOptionForEvent_${currentProcessingInvitation.event.id}`}
                              id={`time-opt-${opt.id}`}
                              value={opt.id}
                              checked={selectedTimeOptionId === opt.id}
                              onChange={() => handleTimeOptionChange(opt.id)}
                            />{" "}
                            {new Date(opt.start_time).toLocaleString()}
                            {opt.end_time &&
                              opt.end_time !== opt.start_time &&
                              ` to ${new Date(opt.end_time).toLocaleString()}`}
                          </label>
                        </div>
                      )
                    )
                  ) : (
                    <p>No time options to vote on for this event.</p>
                  )}
                </fieldset>

                <fieldset
                  className="form-fieldset vote-options-group"
                  disabled={isSubmitting}
                >
                  <legend>Preferred Location Option</legend>
                  {currentProcessingInvitation.event.location_options?.length >
                  0 ? (
                    currentProcessingInvitation.event.location_options.map(
                      (opt) => (
                        <div key={`loc-${opt.id}`} className="vote-option-item">
                          <label
                            htmlFor={`loc-opt-${opt.id}`}
                            className="radio-label"
                          >
                            <input
                              type="radio"
                              name={`locationOptionForEvent_${currentProcessingInvitation.event.id}`}
                              id={`loc-opt-${opt.id}`}
                              value={opt.id}
                              checked={selectedLocationOptionId === opt.id}
                              onChange={() =>
                                handleLocationOptionChange(opt.id)
                              }
                            />{" "}
                            {opt.name} ({opt.address})
                            {opt.details && ` - ${opt.details}`}
                          </label>
                        </div>
                      )
                    )
                  ) : (
                    <p>No location options to vote on for this event.</p>
                  )}
                </fieldset>
              </>
            )}

            <div className="modal-actions modal-footer">
              <button
                type="button"
                onClick={handleCloseVoteModal}
                className="button-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={isSubmitting || !currentResponseStatus}
              >
                {isSubmitting ? "Submitting..." : "Submit Response & Votes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InvitedEvents;
