import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import styles from './InviteModal.module.css';

export default function InviteModal({ onClose }) {
  const { activeServer } = useApp();
  const [code, setCode] = useState(activeServer?.inviteCode || '');
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${code}`;

  const copy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refresh = async () => {
    const data = await api.refreshInvite(activeServer.id);
    setCode(data.inviteCode);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Invite friends to {activeServer.name}</h3>
        <p className={styles.hint}>Share this link — friends can join instantly, no signup hassle.</p>

        <div className={styles.field}>
          <label>Invite link</label>
          <div className={styles.copyRow}>
            <input readOnly value={inviteLink} />
            <button onClick={() => copy(inviteLink)}>{copied ? '✓' : 'Copy'}</button>
          </div>
        </div>

        <div className={styles.field}>
          <label>Or share the code</label>
          <div className={styles.copyRow}>
            <input readOnly value={code} className={styles.code} />
            <button onClick={() => copy(code)}>Copy</button>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={refresh} className={styles.secondary}>Refresh code</button>
          <button onClick={onClose} className={styles.primary}>Done</button>
        </div>
      </div>
    </div>
  );
}
