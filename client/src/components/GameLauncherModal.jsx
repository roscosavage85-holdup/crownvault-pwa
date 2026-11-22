import React, { useEffect } from 'react';

export default function GameLauncherModal({
  game,
  userId,
  activeCurrency,
  balance,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!game) return null;

  const query = new URLSearchParams({ userId: userId || '', currency: activeCurrency });
  const gameUrl = `${game.url}?${query.toString()}`;

  return (
    <div className="game-launcher" role="dialog" aria-modal="true" aria-label={`${game.title} game`}>
      <div className="launcher-toolbar">
        <button type="button" className="launcher-back" onClick={onClose}>
          <span aria-hidden="true">←</span> Back to Lobby
        </button>
        <h2>{game.title}</h2>
        <span className={`launcher-balance ${activeCurrency === 'SC' ? 'currency-sc' : 'currency-gc'}`}>
          <span>{activeCurrency}</span>
          <strong>{balance === null || balance === undefined ? '--' : Number(balance).toFixed(2)}</strong>
        </span>
      </div>
      <iframe
        className="game-frame"
        title={game.title}
        src={gameUrl}
        allow="fullscreen; autoplay"
        allowFullScreen
      />
    </div>
  );
}
