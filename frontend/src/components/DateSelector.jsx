import React, { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const DateSelector = ({ trimester }) => {
  const getInitialDate = () => {
    const today = new Date();
    if (trimester === 2) {
      return addDays(today, 13 * 7); // Start of second trimester
    }
    if (trimester === 3) {
      return addDays(today, 27 * 7); // Start of third trimester
    }
    return today;
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate());
  const [selectedDay, setSelectedDay] = useState(currentDate);

  useEffect(() => {
    setCurrentDate(getInitialDate());
    setSelectedDay(getInitialDate());
  }, [trimester]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }

  const handlePrevWeek = () => {
    setCurrentDate(subDays(currentDate, 7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  return (
    <div className="bg-pink-50 rounded-lg p-4 text-gray-700 text-center shadow-md mb-8">
      <div className="flex items-center justify-between">
        <button onClick={handlePrevWeek} className="focus:outline-none">
          <FaChevronLeft />
        </button>
        <div className="flex space-x-4">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors duration-300 ${
                format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
                  ? 'bg-carnation-pink text-white'
                  : 'hover:bg-pink-100'
              }`}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
        <button onClick={handleNextWeek} className="focus:outline-none">
          <FaChevronRight />
        </button>
      </div>
      <p className="mt-2 text-sm">
        {format(weekStart, 'd MMM')} - {format(weekEnd, 'd MMM')}
      </p>
    </div>
  );
};

export default DateSelector; 