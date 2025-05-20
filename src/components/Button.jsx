// import './Button.css';

const Button = ({ Text, className, ...props }) => {
  return (
    <div className="container-button">
      <button className={`btn ${className || ''}`} {...props}>
        {Text}
      </button>
    </div>
  );
};

export default Button;
