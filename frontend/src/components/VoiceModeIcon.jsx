import React from 'react';

const VoiceModeIcon = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="11" 
        fill="#f0f0f0" 
        className="voice-pulse"
      />
      <path d="M12 9V15" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 10.5V13.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 10.5V13.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 11.5V12.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 11.5V12.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export default VoiceModeIcon; 