import Button from "./components/Button";
import { NavLink } from "react-router-dom";
import "./NotFoundPage.css";

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-wrapper">
        <h1>Not found page {":("}</h1>
        <NavLink to="/home" className="not-found-page-btn">
          <Button
            className="cancel-btn not-found-page-btn"
            Text="Back to home"
          />
        </NavLink>
      </div>
    </div>
  );
};

export default NotFoundPage;
