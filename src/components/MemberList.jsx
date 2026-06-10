import { useApp } from '../context/AppContext';
import Avatar from './Avatar';
import styles from './MemberList.module.css';

const STATUS_COLORS = {
  online: 'var(--success)',
  idle: 'var(--warning)',
  dnd: 'var(--danger)',
  offline: 'var(--text-muted)',
};

export default function MemberList() {
  const { members, activeServer } = useApp();
  if (!activeServer) return null;

  const online = members.filter(m => m.status === 'online' || m.status === 'idle' || m.status === 'dnd');
  const offline = members.filter(m => m.status === 'offline');

  const renderMember = (m) => (
    <div key={m.id} className={styles.member}>
      <Avatar
        value={m.avatar}
        size="sm"
        accentColor={m.accent_color || m.accentColor}
        status={STATUS_COLORS[m.status] || STATUS_COLORS.offline}
      />
      <div className={styles.info}>
        <span className={styles.name} style={{ color: m.accent_color || m.accentColor }}>
          {m.display_name || m.displayName}
        </span>
        {(m.custom_status || m.customStatus) && (
          <span className={styles.status}>{m.custom_status || m.customStatus}</span>
        )}
      </div>
    </div>
  );

  return (
    <aside className={styles.panel}>
      {online.length > 0 && (
        <section>
          <h4>Online — {online.length}</h4>
          {online.map(renderMember)}
        </section>
      )}
      {offline.length > 0 && (
        <section>
          <h4>Offline — {offline.length}</h4>
          {offline.map(renderMember)}
        </section>
      )}
    </aside>
  );
}
