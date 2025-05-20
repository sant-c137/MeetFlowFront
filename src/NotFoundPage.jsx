import Button from './components/Button';
import { NavLink } from 'react-router-dom';
// import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <h1>Not found page {':('}</h1>
      <NavLink to="/" className="not-found-page-btn">
        <Button
          className="cancel-btn not-found-page-btn"
          Text="Back to login"
        />
      </NavLink>
    </div>
  );
};

export default NotFoundPage;
