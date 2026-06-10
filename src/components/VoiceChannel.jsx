import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import { accentGradientSoft } from '../utils/color';
import Avatar from './Avatar';
import UserPlate from './UserPlate';
import styles from './VoiceChannel.module.css';

export default function VoiceChannel() {
  const { activeChannel, activeServer, leaveVoiceChannel, setMobileView } = useApp();
  const voice = useVoice(activeChannel?.id);

  useEffect(() => {
    if (activeChannel?.type === 'voice' && !voice.joined && !voice.error) {
      voice.join();
    }
  }, [activeChannel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeServer || !activeChannel) return null;

  const handleLeave = () => {
    voice.leave();
    leaveVoiceChannel();
  };

  const showConnecting = voice.joined && voice.participants.length === 0 && !voice.error;

  return (
    <main className={styles.voice}>
      <header className={styles.header}>
        <span className={styles.icon}>🔊</span>
        <h2>{activeChannel.name}</h2>
        <button
          type="button"
          className={styles.membersBtn}
          onClick={() => setMobileView('members')}
          title="Show members"
        >
          👥
        </button>
      </header>

      <div className={styles.body}>
        {voice.error && (
          <div className={styles.errorBox}>
            <p className={styles.error}>{voice.error}</p>
            <button type="button" onClick={voice.join}>Try again</button>
          </div>
        )}

        {!voice.joined && !voice.error && (
          <p className={styles.status}>Joining voice channel...</p>
        )}

        <div className={styles.grid}>
          {voice.participants.map(p => (
            <div
              key={p.userId}
              className={`${styles.card} ${p.muted ? styles.muted : ''}`}
              style={{ '--plate-gradient': accentGradientSoft(p.accentColor) }}
            >
              <div className={styles.plate}>
                <Avatar value={p.avatar} size="lg" accentColor={p.accentColor} gradient />
                <UserPlate name={p.displayName} accentColor={p.accentColor} size="md" />
              </div>
              <div className={styles.badges}>
                {p.muted && <span title="Muted">🔇</span>}
                {p.deafened && <span title="Deafened">🎧</span>}
                {!p.muted && !p.deafened && <span className={styles.speaking}>●</span>}
              </div>
            </div>
          ))}
          {showConnecting && (
            <p className={styles.empty}>Connected — waiting for others...</p>
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
        <button className={`${styles.ctrl} ${styles.leave}`} onClick={handleLeave} title="Disconnect">
          📞
        </button>
      </footer>
    </main>
  );
}
