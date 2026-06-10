import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import styles from './UserBar.module.css';

const STATUS_COLORS = {
  online: 'var(--success)',
  idle: 'var(--warning)',
  dnd: 'var(--danger)',
  offline: 'var(--text-muted)',
};

export default function UserBar() {
  const { user, setPanel } = useApp();
  if (!user) return null;

  return (
    <div className={styles.bar}>
      <button className={styles.profile} onClick={() => setPanel('profile')}>
        <Avatar
          value={user.avatar}
          size="sm"
          accentColor={user.accentColor}
          status={STATUS_COLORS[user.status] || STATUS_COLORS.offline}
        />
        <div className={styles.info}>
          <span className={styles.name}>{user.displayName}</span>
          <span className={styles.sub}>{user.customStatus || user.username}</span>
        </div>
      </button>
      <button className={styles.settingsBtn} onClick={() => setPanel('settings')} title="Settings">
        ⚙️
      </button>
    </div>
  );
}
