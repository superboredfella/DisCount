import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './Home.module.css';

export default function Home() {
  const { user, servers, createServer, joinServer } = useApp();
  const [inviteCode, setInviteCode] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      await joinServer(inviteCode.trim());
    } catch {}
  };

  return (
    <main className={styles.home}>
      <div className={styles.hero}>
        <h1>Hey, {user.displayName} 👋</h1>
        <p>Welcome to Discont — your space to chat, customize, and connect.</p>
      </div>

      <div className={styles.grid}>
        <button className={styles.card} onClick={() => createServer('My Server', '🏠')}>
          <span className={styles.icon}>➕</span>
          <h3>Create a server</h3>
          <p>Start your own community in seconds</p>
        </button>

        <form className={styles.card} onSubmit={handleJoin}>
          <span className={styles.icon}>🔗</span>
          <h3>Join with invite</h3>
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code"
          />
          <button type="submit" className={styles.joinBtn}>Join</button>
        </form>

        {servers.length > 0 && (
          <div className={styles.card}>
            <span className={styles.icon}>📋</span>
            <h3>Your servers</h3>
            <ul className={styles.serverList}>
              {servers.map(s => (
                <li key={s.id}>
                  <span>{s.icon}</span> {s.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <strong>⚡ Lightweight</strong>
          <span>Fast, minimal, no bloat</span>
        </div>
        <div className={styles.feature}>
          <strong>🎨 Customizable</strong>
          <span>Themes, fonts, profiles & more</span>
        </div>
        <div className={styles.feature}>
          <strong>🔗 Easy sharing</strong>
          <span>One-click invite links</span>
        </div>
        <div className={styles.feature}>
          <strong>💚 100% free</strong>
          <span>No ads, no premium tiers</span>
        </div>
      </div>
    </main>
  );
}
