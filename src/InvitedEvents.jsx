import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EventCard from "./EventCard";
import Modal from "react-modal";
import "./InvitedEvents.css";

const InvitedEvents = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [currentProcessingInvitation, setCurrentProcessingInvitation] =
    useState(null);
  const [currentResponseStatus, setCurrentResponseStatus] = useState("");
  const [selectedTimeOptionIds, setSelectedTimeOptionIds] = useState(new Set());
  const [selectedLocationOptionIds, setSelectedLocationOptionIds] = useState(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const VOTE_PREFERENCE_IF_CHECKED = 5;

  const fetchInvitedEvents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchInvitedEvents();
  }, [fetchInvitedEvents]);

  const handleOpenVoteModal = (invitation) => {
    setCurrentProcessingInvitation(invitation);
    setCurrentResponseStatus(
      invitation.status === "pending" ? "" : invitation.status
    );

    const initialTimeIds = new Set();
    invitation.event.time_options?.forEach((opt) => {
      if (opt.user_vote === VOTE_PREFERENCE_IF_CHECKED) {
        initialTimeIds.add(opt.id);
      }
    });
    setSelectedTimeOptionIds(initialTimeIds);

    const initialLocationIds = new Set();
    invitation.event.location_options?.forEach((opt) => {
      if (opt.user_vote === VOTE_PREFERENCE_IF_CHECKED) {
        initialLocationIds.add(opt.id);
      }
    });
    setSelectedLocationOptionIds(initialLocationIds);

    setIsVoteModalOpen(true);
  };

  const handleCloseVoteModal = () => {
    setIsVoteModalOpen(false);
    setCurrentProcessingInvitation(null);
    setCurrentResponseStatus("");
    setSelectedTimeOptionIds(new Set());
    setSelectedLocationOptionIds(new Set());
    setIsSubmitting(false);
  };

  const handleTimeOptionToggle = (optionId) => {
    setSelectedTimeOptionIds((prevIds) => {
      const newIds = new Set(prevIds);
      if (newIds.has(optionId)) newIds.delete(optionId);
      else newIds.add(optionId);
      return newIds;
    });
  };

  const handleLocationOptionToggle = (optionId) => {
    setSelectedLocationOptionIds((prevIds) => {
      const newIds = new Set(prevIds);
      if (newIds.has(optionId)) newIds.delete(optionId);
      else newIds.add(optionId);
      return newIds;
    });
  };

  const handleSubmitResponseAndVotes = async (e) => {
    e.preventDefault();
    if (!currentProcessingInvitation || !currentResponseStatus) {
      alert("Please select a response status (Accept, Decline, or Tentative).");
      return;
    }
    setIsSubmitting(true);

    const { id: invitationId, event } = currentProcessingInvitation;

    try {
      const promises = [];

      promises.push(
        axios.put(`/api/invitations/${invitationId}/respond/`, {
          status: currentResponseStatus,
        })
      );

      event.time_options?.forEach((opt) => {
        if (selectedTimeOptionIds.has(opt.id)) {
          promises.push(
            axios.post(`/api/time_options/${opt.id}/vote/`, {
              preference: VOTE_PREFERENCE_IF_CHECKED,
            })
          );
        } else if (opt.user_vote !== null && opt.user_vote !== undefined) {
        }
      });

      event.location_options?.forEach((opt) => {
        if (selectedLocationOptionIds.has(opt.id)) {
          promises.push(
            axios.post(`/api/location_options/${opt.id}/vote/`, {
              preference: VOTE_PREFERENCE_IF_CHECKED,
            })
          );
        } else if (opt.user_vote !== null && opt.user_vote !== undefined) {
        }
      });

      await Promise.all(promises);

      alert("Response and votes submitted successfully!");

      fetchInvitedEvents();
      handleCloseVoteModal();
    } catch (err) {
      console.error("Failed to submit response and votes:", err);
      let errorMessage = "An error occurred during submission.";
      if (err.response && err.response.data) {
        errorMessage =
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(`Error: ${errorMessage}`);
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
                className={`invitation-item status-${invitation.status}`}
              >
                <EventCard event={invitation.event} />
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
          onRequestClose={handleCloseVoteModal}
          contentLabel="Respond to Invitation and Vote"
          className="modal vote-modal"
          overlayClassName="modal-overlay"
          appElement={document.getElementById("root") || undefined}
        >
          <h2>{currentProcessingInvitation.event.title}</h2>
          <form onSubmit={handleSubmitResponseAndVotes} className="modal-form">
            <fieldset className="form-fieldset">
              <legend>Your Response *</legend>
              <div className="form-group radio-group">
                {["accepted", "declined", "tentative"].map((statusValue) => (
                  <label key={statusValue}>
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

            {/* Solo mostrar opciones de voto si se acepta o es tentativo */}
            {(currentResponseStatus === "accepted" ||
              currentResponseStatus === "tentative") && (
              <>
                <fieldset className="form-fieldset">
                  <legend>Preferred Time Options</legend>
                  {currentProcessingInvitation.event.time_options?.length >
                  0 ? (
                    currentProcessingInvitation.event.time_options.map(
                      (opt) => (
                        <div
                          key={`time-${opt.id}`}
                          className="checkbox-option-item"
                        >
                          <label>
                            <input
                              type="checkbox"
                              id={`time-opt-${opt.id}`}
                              checked={selectedTimeOptionIds.has(opt.id)}
                              onChange={() => handleTimeOptionToggle(opt.id)}
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

                <fieldset className="form-fieldset">
                  <legend>Preferred Location Options</legend>
                  {currentProcessingInvitation.event.location_options?.length >
                  0 ? (
                    currentProcessingInvitation.event.location_options.map(
                      (opt) => (
                        <div
                          key={`loc-${opt.id}`}
                          className="checkbox-option-item"
                        >
                          <label>
                            <input
                              type="checkbox"
                              id={`loc-opt-${opt.id}`}
                              checked={selectedLocationOptionIds.has(opt.id)}
                              onChange={() =>
                                handleLocationOptionToggle(opt.id)
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

            <div className="modal-actions">
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
                disabled={isSubmitting}
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
