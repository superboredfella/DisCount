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

function Main() {
  const { user, loading, activeServer, activeChannel, panel } = useApp();

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user) return <Auth />;

  const isVoice = activeChannel?.type === 'voice';

  return (
    <div className={styles.app}>
      <JoinRedirect />
      <ServerRail />
      <Sidebar />
      {activeServer ? (isVoice ? <VoiceChannel /> : <ChatArea />) : <Home />}
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
