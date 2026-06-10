import { useState } from 'react';
import { useApp } from '../context/AppContext';
import styles from './Auth.module.css';

const AVATARS = ['😊', '🦊', '🐱', '🐸', '🦄', '🐼', '🦁', '🐙', '🎮', '🎨', '🚀', '⭐'];

export default function Auth() {
  const { login } = useApp();
  const [mode, setMode] = useState('register');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('😊');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, displayName || username, mode === 'register', avatar);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          <h1>Discont</h1>
          <p>Lightweight. Customizable. Free.</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={mode === 'register' ? styles.active : ''}
            onClick={() => setMode('register')}
          >
            Create account
          </button>
          <button
            className={mode === 'login' ? styles.active : ''}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Username
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="cooluser"
              minLength={3}
              required
              autoFocus
            />
          </label>

          {mode === 'register' && (
            <>
              <label>
                Display name
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Cool User"
                />
              </label>
              <div className={styles.avatarPicker}>
                <span>Pick an avatar</span>
                <div className={styles.avatars}>
                  {AVATARS.map(a => (
                    <button
                      key={a}
                      type="button"
                      className={avatar === a ? styles.selected : ''}
                      onClick={() => setAvatar(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Get started' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          100% free — no ads, no premium tiers, no limits.
        </p>
      </div>
    </div>
  );
}
