import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CalendarClass {
  id: string;
  name: string;
  date: string;
  time: string;
  instructor: string;
  classType: string;
}

const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [classes, setClasses] = useState<CalendarClass[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getClassesForDay = (date: Date) =>
    classes.filter(c => isSameDay(new Date(c.date), date));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-aura-cream">Class Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-aura-ink border border-aura-umber text-aura-sand hover:text-aura-cream"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-aura-cream font-medium min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-aura-ink border border-aura-umber text-aura-sand hover:text-aura-cream"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-aura-ink rounded-xl border border-aura-umber p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-medium text-aura-sand py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, idx) => {
            const dayClasses = getClassesForDay(d);
            const isCurrentMonth = isSameMonth(d, currentMonth);
            return (
              <div
                key={idx}
                onClick={() => {
                  if (dayClasses.length > 0) {
                    navigate(`/classes/${dayClasses[0].id}`);
                  }
                }}
                className={`min-h-[80px] md:min-h-[100px] rounded-lg p-1 border transition-colors cursor-pointer ${
                  isCurrentMonth
                    ? 'bg-aura-bark border-aura-umber hover:border-aura-umber'
                    : 'bg-aura-bark/50 border-transparent'
                }`}
              >
                <div className={`text-xs font-medium ${isCurrentMonth ? 'text-aura-cream' : 'text-aura-sand'}`}>
                  {format(d, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayClasses.slice(0, 2).map(c => (
                    <div
                      key={c.id}
                      className="text-[10px] px-1 py-0.5 rounded bg-purple-900/40 text-purple-200 truncate"
                      title={`${c.name} — ${c.time}`}
                    >
                      {c.time} {c.name}
                    </div>
                  ))}
                  {dayClasses.length > 2 && (
                    <div className="text-[10px] text-aura-sand pl-1">+{dayClasses.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
