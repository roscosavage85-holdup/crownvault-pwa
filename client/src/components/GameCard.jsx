import React from 'react';

export default function GameCard({ game, onPlay, onToggleFavorite, rank, compact = false }) {
  return (
    <article className={`game-card${compact ? ' game-card-compact' : ''}`}>
      {rank && <span className="game-rank" aria-hidden="true">{rank}</span>}
      <button
        type="button"
        className="game-card-open"
        onClick={() => onPlay(game)}
        aria-label={`Play ${game.title}`}
      >
        <span className={`game-art game-art-${game.art}`} aria-hidden="true">
          <span className="art-orbit" />
          <span className="art-icon">{game.icon}</span>
          <span className="game-tag">{game.tag}</span>
        </span>
        <span className="game-card-info">
          <span className="game-title">{game.title}</span>
          <span className="game-provider">{game.provider}</span>
        </span>
      </button>
      <button
        type="button"
        className={`favorite-button${game.isFavorite ? ' is-favorite' : ''}`}
        aria-label={game.isFavorite ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        aria-pressed={Boolean(game.isFavorite)}
        onClick={() => onToggleFavorite(game.id)}
      >
        {game.isFavorite ? '♥' : '♡'}
      </button>
    </article>
  );
}
