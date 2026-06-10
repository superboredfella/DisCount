import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import styles from './MessageInput.module.css';

export default function MessageInput() {
  const { activeChannel, sendMessage, emit } = useApp();
  const [text, setText] = useState('');
  const typingRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    emit('typing:start', { channelId: activeChannel.id });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      emit('typing:stop', { channelId: activeChannel.id });
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    emit('typing:stop', { channelId: activeChannel.id });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Message #${activeChannel?.name || 'channel'}`}
        autoComplete="off"
      />
      <button type="submit" disabled={!text.trim()} className={styles.send}>
        ➤
      </button>
    </form>
  );
}
