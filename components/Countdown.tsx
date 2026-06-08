'use client';

import { useEffect, useState } from 'react';
import { BID_CLOSE_TIME } from '@/lib/constants';

function getTimeLeft() {
  const diff = BID_CLOSE_TIME.getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function Countdown() {
  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-2">
        <span className="text-red-400 font-bold text-sm uppercase tracking-wider">🔒 Bidding Closed</span>
      </div>
    );
  }

  const parts = [
    { label: 'Days',    val: time.d },
    { label: 'Hours',   val: time.h },
    { label: 'Minutes', val: time.m },
    { label: 'Seconds', val: time.s },
  ];

  const isUrgent = time.d === 0 && time.h < 6;

  return (
    <div className={`flex items-center gap-1 rounded-lg px-3 py-2 border ${
      isUrgent
        ? 'bg-red-900/30 border-red-700/50'
        : 'bg-gray-900/60 border-gray-700/50'
    }`}>
      <span className="text-gray-400 text-xs uppercase tracking-wider mr-2 hidden sm:block">
        Closes in
      </span>
      {parts.map(({ label, val }, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className="text-center min-w-[2.5rem]">
            <div className={`text-xl font-bold tabular-nums leading-none ${
              isUrgent ? 'text-red-400' : 'text-white'
            }`}>
              {String(val).padStart(2, '0')}
            </div>
            <div className="text-gray-500 text-[9px] uppercase tracking-wider mt-0.5">{label}</div>
          </div>
          {i < 3 && <span className={`text-lg font-bold mb-1 ${isUrgent ? 'text-red-500' : 'text-gray-600'}`}>:</span>}
        </div>
      ))}
    </div>
  );
}
