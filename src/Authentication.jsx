import Login from "./auth/Login";
import Register from "./auth/Register";
import "./Authentication.css";

const Authentication = () => {
  return (
    <div className="container">
      <div className="logo-name-slogan">
        <img src="logo.png" alt="" />

        <div className="wellcome-text">
          <h1>Welcome to MeetFlow!</h1>
          <p>Plan and manage your events seamlessly</p>
        </div>
      </div>
      <div className="tab-content">
        <Login />

        <Register />
      </div>
    </div>
  );
};

export default Authentication;
