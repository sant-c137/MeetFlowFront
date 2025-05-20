import { useState } from 'react';
import Login from './auth/Login';
import Register from './auth/Register';
// import './Authentication.css';

const Authentication = () => {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="container">
      <h2>Welcome to MeetFlow</h2>
      <div className="tabs">
        <input
          type="radio"
          name="tabs"
          id="tab1"
          className="tab-input"
          checked={activeTab === 'login'}
          onChange={() => setActiveTab('login')}
        />
        <input
          type="radio"
          name="tabs"
          id="tab2"
          className="tab-input"
          checked={activeTab === 'register'}
          onChange={() => setActiveTab('register')}
        />

        <div className="tab-nav">
          <label htmlFor="tab1" className="tab-label">
            Login
          </label>
          <label htmlFor="tab2" className="tab-label">
            Register
          </label>
        </div>

        <div id="content1" className="tab-content">
          <Login />
        </div>

        <div id="content2" className="tab-content">
          <Register />
        </div>
      </div>
    </div>
  );
};

export default Authentication;
