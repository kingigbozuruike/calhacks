import { Link } from 'react-router-dom';

function Logo({ className = "" }) {
  return (
    <Link to="/">
      <div className={`font-medium text-thistle ${className}`} style={{fontFamily: 'Fredoka'}}>
        bu<span className="text-carnation-pink">mp</span>
      </div>
    </Link>
  );
}

export default Logo;