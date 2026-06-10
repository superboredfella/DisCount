import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { resizeImage } from '../utils/image';
import IconDisplay from './IconDisplay';
import ImageUpload from './ImageUpload';
import styles from './ServerRail.module.css';

const SERVER_ICONS = ['🏠', '🎮', '🎵', '📚', '💻', '🎨', '⚽', '🍕', '🌙', '🔥'];

export default function ServerRail() {
  const { servers, activeServer, selectServer, createServer, joinServer, setPanel } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleIconUpload = async (file) => {
    try {
      const dataUrl = await resizeImage(file, 256);
      const { url } = await api.upload('server-icon', dataUrl);
      setIcon(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createServer(name.trim(), icon);
    setShowCreate(false);
    setName('');
    setIcon('🏠');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await joinServer(inviteCode.trim());
      setShowJoin(false);
      setInviteCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <nav className={`${styles.rail} server-rail`}>
      <button
        className={`${styles.serverBtn} ${styles.home} ${!activeServer ? styles.active : ''}`}
        onClick={() => selectServer(null)}
        title="Home"
      >
        💬
      </button>

      <div className={styles.divider} />

      {servers.map(s => (
        <button
          key={s.id}
          className={`${styles.serverBtn} ${activeServer?.id === s.id ? styles.active : ''}`}
          onClick={() => selectServer(s)}
          title={s.name}
        >
          <IconDisplay value={s.icon} size="rail" />
        </button>
      ))}

      <button className={`${styles.serverBtn} ${styles.add}`} onClick={() => setShowCreate(true)} title="Create server">
        +
      </button>
      <button className={`${styles.serverBtn} ${styles.add}`} onClick={() => setShowJoin(true)} title="Join server">
        →
      </button>

      <div className={styles.spacer} />

      <button className={styles.serverBtn} onClick={() => setPanel('settings')} title="Settings">
        ⚙️
      </button>

      {showCreate && (
        <div className={styles.modal} onClick={() => setShowCreate(false)}>
          <form className={styles.modalCard} onClick={e => e.stopPropagation()} onSubmit={handleCreate}>
            <h3>Create a server</h3>
            <div className={styles.iconPreview}>
              <IconDisplay value={icon} size="lg" />
            </div>
            <ImageUpload label="Upload server icon" onFile={handleIconUpload} />
            <div className={styles.iconPicker}>
              {SERVER_ICONS.map(i => (
                <button key={i} type="button" className={icon === i ? styles.selected : ''} onClick={() => setIcon(i)}>
                  {i}
                </button>
              ))}
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Server name" autoFocus required />
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className={styles.primary}>Create</button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div className={styles.modal} onClick={() => setShowJoin(false)}>
          <form className={styles.modalCard} onClick={e => e.stopPropagation()} onSubmit={handleJoin}>
            <h3>Join a server</h3>
            <p className={styles.hint}>Enter an invite code from a friend</p>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              autoFocus
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowJoin(false)}>Cancel</button>
              <button type="submit" className={styles.primary}>Join</button>
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
