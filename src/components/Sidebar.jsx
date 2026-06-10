import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import UserBar from './UserBar';
import InviteModal from './InviteModal';
import ServerSettingsModal from './ServerSettingsModal';
import IconDisplay from './IconDisplay';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const {
    activeServer, categories, channels, activeChannel, voiceState,
    selectChannel, createChannel, createCategory, updateChannel, deleteChannel,
    setMobileView,
  } = useApp();
  const [showInvite, setShowInvite] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('text');
  const [channelCategory, setChannelCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [menuChannel, setMenuChannel] = useState(null);
  const [renameName, setRenameName] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuChannel) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuChannel(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuChannel]);

  if (!activeServer) return null;

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    const name = channelType === 'text'
      ? channelName.trim().toLowerCase().replace(/\s+/g, '-')
      : channelName.trim();
    await createChannel(name, channelType, channelCategory || null);
    setChannelName('');
    setChannelType('text');
    setChannelCategory('');
    setShowNewChannel(false);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    await createCategory(categoryName.trim());
    setCategoryName('');
    setShowNewCategory(false);
  };

  const openMenu = (e, ch) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuChannel(ch);
    setRenameName(ch.name);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!menuChannel || !renameName.trim()) return;
    await updateChannel(menuChannel.id, renameName.trim());
    setMenuChannel(null);
  };

  const handleDelete = async () => {
    if (!menuChannel) return;
    if (!window.confirm(`Delete channel #${menuChannel.name}? This cannot be undone.`)) return;
    await deleteChannel(menuChannel.id);
    setMenuChannel(null);
  };

  const renderChannel = (ch) => {
    const inVoice = voiceState[ch.id] || [];
    const isVoice = ch.type === 'voice';

    return (
      <div key={ch.id} className={styles.channelWrap}>
        <button
          className={`${styles.channel} ${activeChannel?.id === ch.id ? styles.active : ''}`}
          onClick={() => selectChannel(ch)}
          onContextMenu={(e) => openMenu(e, ch)}
        >
          <span className={styles.channelIcon}>{isVoice ? '🔊' : '#'}</span>
          {ch.name}
          {isVoice && inVoice.length > 0 && (
            <span className={styles.voiceCount}>{inVoice.length}</span>
          )}
          <span
            className={styles.channelMenuBtn}
            onClick={(e) => openMenu(e, ch)}
            title="Channel options"
          >
            ⋮
          </span>
        </button>
        {isVoice && inVoice.length > 0 && (
          <div className={styles.voiceUsers}>
            {inVoice.map(p => (
              <div key={p.userId} className={styles.voiceUser}>
                <span className={styles.voiceDot} />
                {p.displayName}
                {p.muted && ' 🔇'}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const uncategorized = channels.filter(c => !c.category_id);
  const sortedCategories = [...categories].sort((a, b) => a.position - b.position);

  return (
    <aside className={`${styles.sidebar} channel-sidebar`}>
      <header className={styles.header}>
        <button className={styles.serverTitle} onClick={() => setShowServerSettings(true)}>
          <IconDisplay value={activeServer.icon} size="sm" />
          <h2>{activeServer.name}</h2>
        </button>
        <button onClick={() => setShowInvite(true)} title="Invite friends">📋</button>
        <button
          type="button"
          className={styles.membersBtn}
          onClick={() => setMobileView('members')}
          title="Show members"
        >
          👥
        </button>
      </header>

      <div className={styles.channels}>
        {sortedCategories.map(cat => {
          const catChannels = channels
            .filter(c => c.category_id === cat.id)
            .sort((a, b) => a.position - b.position);
          return (
            <div key={cat.id} className={styles.categoryGroup}>
              <div className={styles.category}>
                <span>{cat.name.toUpperCase()}</span>
                <button onClick={() => { setChannelCategory(cat.id); setShowNewChannel(true); }} title="Add channel">+</button>
              </div>
              {catChannels.length > 0 ? catChannels.map(renderChannel) : (
                <p className={styles.emptyCategory}>No channels yet — click + to add one</p>
              )}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div className={styles.categoryGroup}>
            <div className={styles.category}>
              <span>CHANNELS</span>
              <button onClick={() => setShowNewChannel(true)} title="Add channel">+</button>
            </div>
            {uncategorized.map(renderChannel)}
          </div>
        )}

        <div className={styles.categoryActions}>
          <button onClick={() => setShowNewChannel(true)}>+ Channel</button>
          <button onClick={() => setShowNewCategory(true)}>+ Category</button>
        </div>
      </div>

      <UserBar />

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {showServerSettings && <ServerSettingsModal onClose={() => setShowServerSettings(false)} />}

      {menuChannel && (
        <div className={styles.modal} onClick={() => setMenuChannel(null)}>
          <form
            ref={menuRef}
            className={styles.modalCard}
            onClick={e => e.stopPropagation()}
            onSubmit={handleRename}
          >
            <h3>Channel settings</h3>
            <p className={styles.menuHint}>
              {menuChannel.type === 'voice' ? '🔊' : '#'} {menuChannel.name}
            </p>
            <label>Rename channel</label>
            <input
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              autoFocus
              required
            />
            <div className={styles.actions}>
              <button type="button" className={styles.danger} onClick={handleDelete}>
                Delete channel
              </button>
              <button type="button" onClick={() => setMenuChannel(null)}>Cancel</button>
              <button type="submit" className={styles.primary}>Save</button>
            </div>
          </form>
        </div>
      )}

      {showNewChannel && (
        <div className={styles.modal} onClick={() => setShowNewChannel(false)}>
          <form className={styles.modalCard} onClick={e => e.stopPropagation()} onSubmit={handleCreateChannel}>
            <h3>Create channel</h3>
            <div className={styles.typeRow}>
              <button type="button" className={channelType === 'text' ? styles.typeActive : ''} onClick={() => setChannelType('text')}>
                # Text
              </button>
              <button type="button" className={channelType === 'voice' ? styles.typeActive : ''} onClick={() => setChannelType('voice')}>
                🔊 Voice
              </button>
            </div>
            <input
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              placeholder={channelType === 'text' ? 'new-channel' : 'Voice Lounge'}
              autoFocus
              required
            />
            {categories.length > 0 && (
              <select value={channelCategory} onChange={e => setChannelCategory(e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <div className={styles.actions}>
              <button type="button" onClick={() => setShowNewChannel(false)}>Cancel</button>
              <button type="submit" className={styles.primary}>Create</button>
            </div>
          </form>
        </div>
      )}

      {showNewCategory && (
        <div className={styles.modal} onClick={() => setShowNewCategory(false)}>
          <form className={styles.modalCard} onClick={e => e.stopPropagation()} onSubmit={handleCreateCategory}>
            <h3>Create category</h3>
            <input
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
              placeholder="Category name"
              autoFocus
              required
            />
            <div className={styles.actions}>
              <button type="button" onClick={() => setShowNewCategory(false)}>Cancel</button>
              <button type="submit" className={styles.primary}>Create</button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
