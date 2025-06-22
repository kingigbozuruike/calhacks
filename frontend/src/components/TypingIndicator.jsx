import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
        <img src="/images/representing-ai.webp" alt="AI" className="w-full h-full object-cover object-left" />
      </div>
      <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-3 max-w-xs md:max-w-md">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;