import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import UserPlate from './UserPlate';
import styles from './MessageList.module.css';

function formatTime(ts) {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({ bottomRef }) {
  const { messages, settings, user, deleteMessage } = useApp();

  if (!messages.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.welcome}>
          <span className={styles.welcomeHash}>#</span>
          <h3>Welcome to the beginning!</h3>
          <p>This is the start of the channel. Say hello!</p>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  let lastUserId = null;
  let lastTime = 0;

  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    await deleteMessage(msg.id);
  };

  return (
    <div className={styles.list}>
      {messages.map((msg) => {
        const grouped = msg.user_id === lastUserId && (msg.created_at - lastTime) < 300000;
        lastUserId = msg.user_id;
        lastTime = msg.created_at;
        const isOwn = user?.id === msg.user_id;

        return (
          <div
            key={msg.id}
            className={`${styles.message} ${grouped ? styles.grouped : ''} ${settings.animateMessages ? styles.animate : ''}`}
            style={{ marginBottom: grouped ? '0' : 'var(--message-spacing)' }}
          >
            {!grouped && settings.showAvatars && (
              <Avatar value={msg.avatar} size="md" accentColor={msg.accent_color} gradient />
            )}
            {!grouped && !settings.showAvatars && <div className={styles.avatarSpacer} />}
            <div className={styles.content}>
              {!grouped && (
                <div className={styles.meta}>
                  <UserPlate name={msg.display_name} accentColor={msg.accent_color} size="md" />
                  {settings.showTimestamps && (
                    <span className={styles.time}>{formatTime(msg.created_at)}</span>
                  )}
                </div>
              )}
              <p className={styles.text}>{msg.content}</p>
            </div>
            {isOwn && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(msg)}
                title="Delete message"
              >
                🗑
              </button>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
