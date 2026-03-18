import React, { useState, useEffect } from 'react';

function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

function formatTimeRemaining(hours: number, minutes: number, seconds: number): string {
  if (hours >= 1) {
    return `Reset dans ${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `Reset dans ${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function DailyResetTimer() {
  const [time, setTime] = useState(() => getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-pixel text-[8px] text-muted-foreground tabular-nums">
      {formatTimeRemaining(time.hours, time.minutes, time.seconds)}
    </span>
  );
}

export default DailyResetTimer;
