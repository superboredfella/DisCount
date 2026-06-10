import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { resizeImage } from '../utils/image';
import IconDisplay from './IconDisplay';
import ImageUpload from './ImageUpload';
import styles from './ServerSettingsModal.module.css';

const SERVER_ICONS = ['🏠', '🎮', '🎵', '📚', '💻', '🎨', '⚽', '🍕', '🌙', '🔥'];

export default function ServerSettingsModal({ onClose }) {
  const { activeServer, updateServer } = useApp();
  const [name, setName] = useState(activeServer.name);
  const [icon, setIcon] = useState(activeServer.icon);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleIconUpload = async (file) => {
    setError('');
    try {
      const dataUrl = await resizeImage(file, 256);
      const { url } = await api.upload('server-icon', dataUrl);
      setIcon(url);
      await updateServer(activeServer.id, { name, icon: url });
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await updateServer(activeServer.id, { name, icon });
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>Server settings</h3>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.preview}>
          <IconDisplay value={icon} size="lg" />
        </div>

        <ImageUpload label="Upload server icon" onFile={handleIconUpload} />

        <div className={styles.field}>
          <label>Or pick an emoji</label>
          <div className={styles.iconPicker}>
            {SERVER_ICONS.map(i => (
              <button key={i} type="button" className={icon === i ? styles.selected : ''} onClick={() => setIcon(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>Server name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className={styles.primary} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
