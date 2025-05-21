import { useState } from "react";
import Header from "./Header";
import axios from "axios";
import MyEvents from "./MyEvents";
import InvitedEvents from "./InvitedEvents";
import "./Home.css";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);

    setTitle("");
    setDescription("");
  };

  const handleSubmitEvent = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/events/",
        {
          title,
          description,
        },

        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg =
            errorData.error || errorData.detail || JSON.stringify(errorData);
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const newEvent = await response.json();
      console.log("Event created:", newEvent);
      setSuccessMessage(`Event "${newEvent.title}" created successfully!`);
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create event:", err);
      setError(err.message || "Failed to create event. Please try again.");
    }
  };

  return (
    <>
      <div className="home-wrapper">
        <div className="home-container">
          <Header />

          <div className="events-container">
            <div className="my-events">
              <MyEvents />
            </div>

            <div className="invited-events">
              <InvitedEvents />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
