'use client';

import { useState, useEffect, useRef } from 'react';
import { Team } from '@/lib/types';
import { MIN_OPENING_BID, MIN_BID_INCREMENT } from '@/lib/constants';

interface Props {
  team: Team | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BidModal({ team, onClose, onSuccess }: Props) {
  const [name, setName]       = useState('');
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const minBid = team
    ? team.current_bid > 0
      ? team.current_bid + MIN_BID_INCREMENT
      : MIN_OPENING_BID
    : MIN_OPENING_BID;

  useEffect(() => {
    if (team) {
      setAmount(minBid.toFixed(2));
      setError('');
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [team]);

  if (!team) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(amount);

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (isNaN(numAmount) || numAmount < minBid) {
      setError(`Bid must be at least $${minBid.toFixed(2)}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team!.id, bidderName: name.trim(), amount: numAmount }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{team.flag_emoji}</span>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{team.name}</div>
              <div className="text-gray-500 text-sm">Group {team.group_name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-2xl leading-none p-1">×</button>
        </div>

        <div className="px-5 pt-4">
          <div className="bg-gray-800/60 rounded-lg p-3 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Current bid</span>
            {team.current_bid > 0 ? (
              <div className="text-right">
                <div className="text-yellow-400 font-bold">${team.current_bid.toFixed(2)}</div>
                <div className="text-gray-500 text-xs">by {team.current_owner}</div>
              </div>
            ) : (
              <span className="text-gray-500 text-sm italic">No bids yet</span>
            )}
          </div>
          <div className="text-gray-500 text-xs text-right mt-1">Minimum bid: ${minBid.toFixed(2)}</div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Your name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Bid amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={minBid}
                step="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors tabular-nums"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-wide"
          >
            {loading ? 'Placing Bid…' : `Bid $${parseFloat(amount || '0').toFixed(2)} on ${team.name}`}
          </button>
        </form>
      </div>
    </div>
  );
}
