import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES, FONTS, DENSITY } from '../styles/themes';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const { settings, updateSettings, logout, setPanel } = useApp();
  const [tab, setTab] = useState('appearance');
  const [customAccent, setCustomAccent] = useState(settings.customAccent || '');

  const update = (key, value) => updateSettings({ [key]: value });

  return (
    <div className={styles.overlay} onClick={() => setPanel(null)}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <nav className={styles.nav}>
          <h3>Settings</h3>
          <button className={tab === 'appearance' ? styles.active : ''} onClick={() => setTab('appearance')}>
            🎨 Appearance
          </button>
          <button className={tab === 'chat' ? styles.active : ''} onClick={() => setTab('chat')}>
            💬 Chat
          </button>
          <button className={tab === 'account' ? styles.active : ''} onClick={() => setTab('account')}>
            👤 Account
          </button>
        </nav>

        <div className={styles.content}>
          <button className={styles.close} onClick={() => setPanel(null)}>✕</button>

          {tab === 'appearance' && (
            <>
              <h2>Appearance</h2>
              <p className={styles.desc}>Customize how Discont looks for you. Settings sync across devices when logged in.</p>

              <section>
                <h4>Theme</h4>
                <div className={styles.themeGrid}>
                  {Object.entries(THEMES).map(([id, t]) => (
                    <button
                      key={id}
                      className={`${styles.themeCard} ${settings.theme === id ? styles.selected : ''}`}
                      onClick={() => update('theme', id)}
                    >
                      <div className={styles.themePreview} style={{ background: t.vars['--bg-primary'] || '#1a1b1e' }}>
                        <div style={{ background: t.vars['--accent'] || '#5865f2', width: '60%', height: 4, borderRadius: 2 }} />
                      </div>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4>Font</h4>
                <div className={styles.optionRow}>
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      className={settings.font === f.id ? styles.active : ''}
                      onClick={() => update('font', f.id)}
                      style={{ fontFamily: f.value }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4>Message density</h4>
                <div className={styles.optionRow}>
                  {Object.keys(DENSITY).map(d => (
                    <button
                      key={d}
                      className={settings.density === d ? styles.active : ''}
                      onClick={() => update('density', d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4>Custom accent color</h4>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    value={customAccent || '#5865f2'}
                    onChange={e => {
                      setCustomAccent(e.target.value);
                      update('customAccent', e.target.value);
                    }}
                  />
                  <button onClick={() => { setCustomAccent(''); update('customAccent', null); }}>
                    Reset to theme default
                  </button>
                </div>
              </section>

              <section>
                <h4>Sidebar width</h4>
                <input
                  type="range"
                  min={180}
                  max={320}
                  value={settings.sidebarWidth || 240}
                  onChange={e => update('sidebarWidth', +e.target.value)}
                  className={styles.slider}
                />
                <span className={styles.sliderVal}>{settings.sidebarWidth || 240}px</span>
              </section>
            </>
          )}

          {tab === 'chat' && (
            <>
              <h2>Chat</h2>
              <section>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.showAvatars !== false}
                    onChange={e => update('showAvatars', e.target.checked)}
                  />
                  <span>Show avatars in messages</span>
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps !== false}
                    onChange={e => update('showTimestamps', e.target.checked)}
                  />
                  <span>Show timestamps</span>
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.animateMessages !== false}
                    onChange={e => update('animateMessages', e.target.checked)}
                  />
                  <span>Animate new messages</span>
                </label>
              </section>
            </>
          )}

          {tab === 'account' && (
            <>
              <h2>Account</h2>
              <p className={styles.desc}>Discont is completely free — no subscriptions, no premium features locked behind paywalls.</p>
              <button className={styles.logout} onClick={logout}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
