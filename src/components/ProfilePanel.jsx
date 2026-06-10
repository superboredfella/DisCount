import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { isImageUrl, resizeImage, resizeBanner } from '../utils/image';
import Avatar from './Avatar';
import ImageUpload from './ImageUpload';
import styles from './ProfilePanel.module.css';

const AVATARS = ['😊', '🦊', '🐱', '🐸', '🦄', '🐼', '🦁', '🐙', '🎮', '🎨', '🚀', '⭐', '🔥', '💎', '🌸', '🎯'];
const STATUSES = [
  { id: 'online', label: 'Online', color: 'var(--success)' },
  { id: 'idle', label: 'Idle', color: 'var(--warning)' },
  { id: 'dnd', label: 'Do Not Disturb', color: 'var(--danger)' },
];
const BANNER_COLORS = ['#5865f2', '#3ba55d', '#e85d4c', '#f0b232', '#eb459e', '#9b59b6', '#1abc9c', '#2c3e50'];

export default function ProfilePanel() {
  const { user, updateProfile, setPanel, emit } = useApp();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || '');
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [accentColor, setAccentColor] = useState(user.accentColor || '#5865f2');
  const [bannerColor, setBannerColor] = useState(user.bannerColor || '#5865f2');
  const [bannerImage, setBannerImage] = useState(user.bannerImage || '');
  const [status, setStatus] = useState(user.status || 'online');
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const saveProfile = async (overrides = {}) => {
    const data = {
      displayName, avatar, bio, customStatus,
      accentColor, bannerColor, bannerImage, status,
      ...overrides,
    };
    await updateProfile(data);
    emit('status:update', data.status);
  };

  const handleAvatarUpload = async (file) => {
    setUploadError('');
    try {
      const dataUrl = await resizeImage(file, 256);
      const { url } = await api.upload('avatar', dataUrl);
      setAvatar(url);
      await saveProfile({ avatar: url });
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleBannerUpload = async (file) => {
    setUploadError('');
    try {
      const dataUrl = await resizeBanner(file);
      const { url } = await api.upload('banner', dataUrl);
      setBannerImage(url);
      await saveProfile({ bannerImage: url });
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const save = async () => {
    setSaving(true);
    setUploadError('');
    try {
      await saveProfile();
    } catch (err) {
      setUploadError(err.message);
    }
    setSaving(false);
  };

  const bannerStyle = bannerImage
    ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: bannerColor };

  return (
    <div className={styles.overlay} onClick={() => setPanel(null)}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={() => setPanel(null)}>✕</button>

        <div className={styles.banner} style={bannerStyle}>
          <div className={styles.bannerControls}>
            <ImageUpload label="Upload banner" onFile={handleBannerUpload} />
            {!bannerImage && (
              <div className={styles.bannerColors}>
                {BANNER_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    style={{ background: c }}
                    className={bannerColor === c ? styles.selected : ''}
                    onClick={() => setBannerColor(c)}
                  />
                ))}
              </div>
            )}
            {bannerImage && (
              <button type="button" className={styles.clearBanner} onClick={() => setBannerImage('')}>
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className={styles.avatarSection}>
          <Avatar value={avatar} size="lg" accentColor={accentColor} />
          <ImageUpload label="Upload avatar" onFile={handleAvatarUpload} className={styles.avatarUpload} />
        </div>

        <div className={styles.body}>
          <h2>Edit Profile</h2>
          {uploadError && <p className={styles.error}>{uploadError}</p>}

          {!isImageUrl(avatar) && (
            <div className={styles.field}>
              <label>Or pick an emoji avatar</label>
              <div className={styles.avatarGrid}>
                {AVATARS.map(a => (
                  <button key={a} type="button" className={avatar === a ? styles.selected : ''} onClick={() => setAvatar(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label>Display name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell people about yourself..." />
          </div>

          <div className={styles.field}>
            <label>Custom status</label>
            <input value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="Listening to music..." />
          </div>

          <div className={styles.field}>
            <label>Accent color</label>
            <div className={styles.colorRow}>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
              <span>{accentColor}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label>Status</label>
            <div className={styles.statusRow}>
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={status === s.id ? styles.active : ''}
                  onClick={() => setStatus(s.id)}
                >
                  <span style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
