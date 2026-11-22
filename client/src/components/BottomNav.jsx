import React from 'react';

const ITEMS = [
  { id: 'store', label: 'Store', icon: '✦' },
  { id: 'redeem', label: 'Redeem', icon: '⌁' },
  { id: 'lobby', label: 'Lobby', icon: '♛' },
  { id: 'favorites', label: 'Favorites', icon: '♡' },
  { id: 'menu', label: 'Menu', icon: '☰' },
];

export default function BottomNav({ activeItem = 'lobby', onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {ITEMS.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`bottom-nav-item${activeItem === item.id ? ' is-active' : ''}${item.id === 'lobby' ? ' lobby-tab' : ''}`}
          aria-current={activeItem === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
