import React, { useEffect, useMemo, useRef, useState } from 'react';
import GameCard from '../components/GameCard';
import GameLauncherModal from '../components/GameLauncherModal';

const GAMES = [
  {
    id: 'royal-vault-reels',
    title: 'Royal Vault Reels',
    provider: 'CrownVault Originals',
    category: 'Slots',
    rtp: '96.0%',
    tag: '96% RTP',
    url: '/games/slot-machine.html',
    art: 'reels',
    icon: '♛',
    isFavorite: false,
  },
  {
    id: 'vault-mines',
    title: 'Vault Mines',
    provider: 'CrownVault Originals',
    category: 'Originals',
    rtp: '97.0%',
    tag: 'ORIGINAL',
    url: '/games/mines.html',
    art: 'mines',
    icon: '✦',
    isFavorite: false,
  },
];

const PROMOS = [
  {
    eyebrow: 'A LITTLE EXTRA, EVERY DAY',
    title: 'Daily Free Reload',
    description: 'Your daily moment of gold. Come back and claim your bonus.',
    action: 'Claim daily bonus',
    icon: '✧',
    theme: 'promo-gold',
  },
  {
    eyebrow: 'YOUR CROWNVAULT WELCOME',
    title: 'Welcome Bonus Package',
    description: 'Make your next play a little more legendary.',
    action: 'Explore the store',
    icon: '♛',
    theme: 'promo-rose',
  },
  {
    eyebrow: 'THE WEEKEND IS YOURS',
    title: 'Weekend Jackpot Drops',
    description: 'Big energy, bright lights, and surprises all weekend long.',
    action: 'See what’s on',
    icon: '✦',
    theme: 'promo-green',
  },
];

const CATEGORIES = ['All', 'Originals', 'Slots', 'Favorites', 'Providers'];

function getSavedFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('crownvaultFavorites') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error('Unable to read saved game favorites:', error);
    return [];
  }
}

export default function LobbyPage({
  userId,
  activeCurrency,
  balances,
  onRefreshBalance,
  initialCategory = 'All',
  onNavigate,
}) {
  const [games, setGames] = useState(() => {
    const saved = new Set(getSavedFavorites());
    return GAMES.map((game) => ({ ...game, isFavorite: saved.has(game.id) }));
  });
  const [category, setCategory] = useState(initialCategory);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('All providers');
  const [activePromo, setActivePromo] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const promoTrack = useRef(null);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesCategory = category === 'All'
      || (category === 'Favorites' && game.isFavorite)
      || (category === 'Providers' && (provider === 'All providers' || game.provider === provider))
      || game.category === category;
    const matchesSearch = `${game.title} ${game.provider} ${game.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, games, provider, search]);

  const toggleFavorite = (gameId) => {
    setGames((currentGames) => {
      const updatedGames = currentGames.map((game) => (
        game.id === gameId ? { ...game, isFavorite: !game.isFavorite } : game
      ));
      try {
        localStorage.setItem(
          'crownvaultFavorites',
          JSON.stringify(updatedGames.filter((game) => game.isFavorite).map((game) => game.id))
        );
      } catch (error) {
        console.error('Unable to save game favorites:', error);
      }
      return updatedGames;
    });
  };

  const closeGame = async () => {
    setSelectedGame(null);
    if (onRefreshBalance) await onRefreshBalance();
  };

  const choosePromo = (index) => {
    setActivePromo(index);
    promoTrack.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  return (
    <main className="lobby-page">
      <section className="promo-section" aria-label="Featured promotions">
        <div
          className="promo-track"
          ref={promoTrack}
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth;
            if (width) setActivePromo(Math.round(event.currentTarget.scrollLeft / width));
          }}
        >
          {PROMOS.map((promo, index) => (
            <article className={`promo-slide ${promo.theme}`} key={promo.title}>
              <div className="promo-copy">
                <span className="promo-eyebrow"><span />{promo.eyebrow}</span>
                <h1>{promo.title}</h1>
                <p>{promo.description}</p>
                <button
                  type="button"
                  className="promo-cta"
                  onClick={() => onNavigate(index === 0 ? 'bonus' : 'store')}
                >
                  {promo.action}<span aria-hidden="true">→</span>
                </button>
              </div>
              <div className="promo-illustration" aria-hidden="true">
                <span className="promo-halo" />
                <span className="promo-emblem">{promo.icon}</span>
                <span className="promo-spark promo-spark-one">✦</span>
                <span className="promo-spark promo-spark-two">✧</span>
              </div>
              <span className="promo-count">0{index + 1}<i> / 03</i></span>
            </article>
          ))}
        </div>
        <div className="promo-dots" aria-label="Choose promotion">
          {PROMOS.map((promo, index) => (
            <button
              type="button"
              key={promo.title}
              className={activePromo === index ? 'is-active' : ''}
              aria-label={`Show promotion ${index + 1}: ${promo.title}`}
              aria-pressed={activePromo === index}
              onClick={() => choosePromo(index)}
            />
          ))}
        </div>
      </section>

      <section className="catalog-section" aria-label="Game catalog">
        <div className="catalog-toolbar">
          <div className="category-scroller" role="tablist" aria-label="Game categories">
            {CATEGORIES.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={category === item}
                className={`category-pill${category === item ? ' is-active' : ''}`}
                key={item}
                onClick={() => setCategory(item)}
              >
                {item === 'Favorites' && <span aria-hidden="true">♡</span>}
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`search-toggle${searchOpen ? ' is-active' : ''}`}
            aria-label={searchOpen ? 'Close game search' : 'Search games'}
            aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((open) => !open); setSearch(''); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          </button>
        </div>
        {searchOpen && (
          <label className="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search games or providers"
              aria-label="Search games or providers"
            />
          </label>
        )}
        {category === 'Providers' && (
          <div className="provider-options" aria-label="Choose provider">
            {['All providers', ...new Set(games.map((game) => game.provider))].map((item) => (
              <button
                type="button"
                key={item}
                className={provider === item ? 'is-selected' : ''}
                onClick={() => setProvider(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <section className="top-games-section" aria-labelledby="top-games-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PLAYER FAVORITES</span>
              <h2 id="top-games-heading">Top Games <span>✦</span></h2>
            </div>
            <span className="section-note">The most-loved picks</span>
          </div>
          <div className="top-games-track">
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                rank={index + 1}
                compact
                onPlay={setSelectedGame}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>

        <section className="all-games-section" aria-labelledby="all-games-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">FIND YOUR NEXT FAVORITE</span>
              <h2 id="all-games-heading">{category === 'Favorites' ? 'Your Favorites' : 'All Games'}</h2>
            </div>
            <span className="game-count">{filteredGames.length} GAMES</span>
          </div>
          {filteredGames.length ? (
            <div className="games-grid">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={setSelectedGame}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="empty-games">
              <span>✧</span>
              <h3>No games found</h3>
              <p>Try another category or search for a different title.</p>
              <button type="button" onClick={() => { setCategory('All'); setSearch(''); }}>
                Browse all games
              </button>
            </div>
          )}
        </section>
      </section>

      <footer className="lobby-footer">
        <span className="footer-crown">♛</span>
        <p>Play for fun. Play responsibly.</p>
        <span>GOLD COINS · SWEEPS COINS</span>
      </footer>

      <GameLauncherModal
        game={selectedGame}
        userId={userId}
        activeCurrency={activeCurrency}
        balance={activeCurrency === 'SC' ? balances?.scBalance : balances?.gcBalance}
        onClose={closeGame}
      />
    </main>
  );
}
