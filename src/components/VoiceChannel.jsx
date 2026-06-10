import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import Avatar from './Avatar';
import styles from './VoiceChannel.module.css';

export default function VoiceChannel() {
  const { activeChannel, activeServer } = useApp();
  const voice = useVoice(activeChannel?.id);

  useEffect(() => {
    if (activeChannel?.type === 'voice') {
      voice.join();
    }
    return () => voice.leave();
  }, [activeChannel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeServer || !activeChannel) return null;

  return (
    <main className={styles.voice}>
      <header className={styles.header}>
        <span className={styles.icon}>🔊</span>
        <h2>{activeChannel.name}</h2>
      </header>

      <div className={styles.body}>
        {voice.error && <p className={styles.error}>{voice.error}</p>}

        <div className={styles.grid}>
          {voice.participants.map(p => (
            <div key={p.userId} className={`${styles.card} ${p.muted ? styles.muted : ''}`}>
              <Avatar value={p.avatar} size="lg" accentColor={p.accentColor} />
              <span className={styles.name}>{p.displayName}</span>
              <div className={styles.badges}>
                {p.muted && <span title="Muted">🔇</span>}
                {p.deafened && <span title="Deafened">🎧</span>}
                {!p.muted && !p.deafened && <span className={styles.speaking}>●</span>}
              </div>
            </div>
          ))}
          {voice.participants.length === 0 && (
            <p className={styles.empty}>Connecting to voice...</p>
          )}
        </div>
      </div>

      <footer className={styles.controls}>
        <button
          className={`${styles.ctrl} ${voice.muted ? styles.active : ''}`}
          onClick={voice.toggleMute}
          title={voice.muted ? 'Unmute' : 'Mute'}
        >
          {voice.muted ? '🔇' : '🎤'}
        </button>
        <button
          className={`${styles.ctrl} ${voice.deafened ? styles.active : ''}`}
          onClick={voice.toggleDeafen}
          title={voice.deafened ? 'Undeafen' : 'Deafen'}
        >
          {voice.deafened ? '🎧' : '🔈'}
        </button>
        <button className={`${styles.ctrl} ${styles.leave}`} onClick={voice.leave} title="Disconnect">
          📞
        </button>
      </footer>
    </main>
  );
}
