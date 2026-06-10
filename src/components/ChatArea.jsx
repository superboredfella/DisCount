import { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import styles from './ChatArea.module.css';

export default function ChatArea() {
  const { activeChannel, activeServer } = useApp();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.id]);

  if (!activeServer || !activeChannel) return null;

  return (
    <main className={styles.chat}>
      <header className={styles.header}>
        <span className={styles.hash}>#</span>
        <h2>{activeChannel.name}</h2>
      </header>
      <MessageList bottomRef={bottomRef} />
      <MessageInput />
    </main>
  );
}
