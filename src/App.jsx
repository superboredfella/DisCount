import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Auth from './components/Auth';
import ServerRail from './components/ServerRail';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceChannel from './components/VoiceChannel';
import MemberList from './components/MemberList';
import Home from './components/Home';
import ProfilePanel from './components/ProfilePanel';
import SettingsPanel from './components/SettingsPanel';
import styles from './App.module.css';

function JoinRedirect() {
  const { joinServer, user } = useApp();

  useEffect(() => {
    const match = window.location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
    if (match && user) {
      joinServer(match[1]).then(() => {
        window.history.replaceState({}, '', '/');
      });
    }
  }, [user, joinServer]);

  return null;
}

function MainContent() {
  const { activeServer, activeChannel } = useApp();

  if (!activeServer) return <Home />;

  if (!activeChannel) {
    return (
      <main className={styles.noChannel}>
        <p>Select a channel to get started</p>
      </main>
    );
  }

  return activeChannel.type === 'voice' ? <VoiceChannel /> : <ChatArea />;
}

function Main() {
  const { user, loading, activeServer, panel, mobileView, setMobileView } = useApp();

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) return <Auth />;

  return (
    <div
      className={styles.app}
      data-mobile-view={mobileView}
      data-has-server={activeServer ? 'true' : 'false'}
    >
      <JoinRedirect />
      <ServerRail />
      <Sidebar />
      <div className={`${styles.mainArea} main-area`}>
        {activeServer && mobileView === 'main' && (
          <button
            type="button"
            className={styles.mobileBack}
            onClick={() => setMobileView('channels')}
          >
            ← Channels
          </button>
        )}
        <MainContent />
      </div>
      {activeServer && <MemberList />}
      {panel === 'profile' && <ProfilePanel />}
      {panel === 'settings' && <SettingsPanel />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
