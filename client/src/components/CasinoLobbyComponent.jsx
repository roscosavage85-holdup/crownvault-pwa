7. REACT CASINO LOBBY & MARQUEE (casino-lobby-component-v2.jsx)
 * FILE: casino-lobby-component-v2.jsx
 ******************************************************************************/

import React, { useState, useEffect } from 'react';

export default function CasinoLobby({ userId, stateCode = 'TX', onSelectGame }) {
  const [category, setCategory] = useState('ALL'); // ALL, FAVORITES, MOST_PLAYED, GOTW
  const [recentWins, setRecentWins] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicker();
    fetchGames(category);
  }, [category, userId]);

  const fetchTicker = async () => {
    try {
      const res = await fetch('/api/wins/recent-ticker');
      const data = await res.json();
      if (data.success) {
        setRecentWins(data.recentWins);
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    }
  };

  const fetchGames = async (cat) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/lobby?userId=${userId || ''}&category=${cat}`);
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
      }
    } catch (err) {
      console.error('Games fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (e, gameTitle) => {
    e.stopPropagation();
    if (!userId) {
      alert('Please log in to add favorites.');
      return;
    }
    try {
      const res = await fetch('/api/games/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setGames(prev => prev.map(g => g.title === gameTitle ? { ...g, isFavorite: data.isFavorite } : g));
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', background: '#0F172A', color: '#FFF', borderRadius: '16px', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Live Winner Marquee Ticker */}
      <div style={{ background: '#1E293B', borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', border: '1px solid #334155', overflow: 'hidden' }}>
        <span style={{ background: '#10B981', color: '#000', fontWeight: 'bold', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', marginRight: '12px', whiteSpace: 'nowrap' }}>
          LIVE WINS
        </span>
        <div style={{ display: 'flex', gap: '24px', whiteSpace: 'nowrap', overflowX: 'auto', fontSize: '13px', color: '#CBD5E1' }}>
          {recentWins.map((win, idx) => (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: '#FFF' }}>{win.player_masked}</strong> won <span style={{ color: '#10B981', fontWeight: 'bold' }}>${parseFloat(win.win_amount_sc).toFixed(2)} SC</span> on <em>{win.game_title}</em>
            </span>
          ))}
        </div>
      </div>

      {/* Featured GOTW Banner */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)', borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ background: '#F59E0B', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px' }}>
            GAME OF THE WEEK
          </span>
          <h2 style={{ margin: '8px 0 4px 0', fontSize: '24px' }}>Neon Spin Deluxe</h2>
          <p style={{ margin: 0, color: '#E0E7FF', fontSize: '14px' }}>Earn 10 Free Spins on Day 7 Login Streak!</p>
        </div>
        <button
          onClick={() => onSelectGame && onSelectGame('Neon Spin Deluxe')}
          style={{ background: '#FFF', color: '#4F46E5', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
        >
          Play Now
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        {[
          { key: 'ALL', label: 'All Games 🎮' },
          { key: 'FAVORITES', label: 'Favorites ❤️' },
          { key: 'MOST_PLAYED', label: 'Most Played 🔥' },
          { key: 'GOTW', label: 'Game of the Week ⭐' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              background: category === tab.key ? '#F59E0B' : '#1E293B',
              color: category === tab.key ? '#000' : '#94A3B8',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading games...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {games.map(game => (
            <div
              key={game.id}
              onClick={() => onSelectGame && onSelectGame(game.title)}
              style={{ background: '#1E293B', borderRadius: '12px', padding: '16px', cursor: 'pointer', position: 'relative', border: '1px solid #334155', transition: 'transform 0.2s' }}
            >
              <button
                onClick={(e) => toggleFavorite(e, game.title)}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: game.isFavorite ? '#EF4444' : '#FFF', fontSize: '16px', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
              >
                {game.isFavorite ? '❤️' : '🤍'}
              </button>
              <div style={{ fontSize: '48px', textAlign: 'center', margin: '12px 0' }}>{game.image}</div>
              <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px', color: '#FFF' }}>{game.title}</h4>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{game.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
