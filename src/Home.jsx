import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Header from "./Header";
import LearningPathMap from "./components/LearningPath/LearningPathMap";
import LessonContent from "./components/LearningPath/LessonContent";
import UserStats from "./components/UserStats";
import "./Home.css";

const Home = () => {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [refreshMapTrigger, setRefreshMapTrigger] = useState(0);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCloseLesson = () => {
    setSelectedLesson(null);
  };

  const handleProgressUpdate = () => {
    setRefreshMapTrigger((prev) => prev + 1);
  };

  return (
    <>
      <div className="home-wrapper">
        <div className="home-container">
          <Header />
          <div className="main-content-layout">
            <div
              className={`map-wrapper ${selectedLesson ? "lesson-open" : ""}`}
            >
              <LearningPathMap 
                onLessonSelect={handleLessonSelect} 
                isSidebarOpen={!!selectedLesson}
                refreshTrigger={refreshMapTrigger}
              />
            </div>

            <AnimatePresence>
              {selectedLesson && (
                <div className="lesson-wrapper">
                  <LessonContent
                    lesson={selectedLesson}
                    onClose={handleCloseLesson}
                    onProgressUpdate={handleProgressUpdate}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
