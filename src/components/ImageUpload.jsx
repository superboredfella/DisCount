import { useRef } from 'react';
import styles from './ImageUpload.module.css';

export default function ImageUpload({ label, onFile, accept = 'image/*', children, className = '' }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <div className={`${styles.wrap} ${className}`}>
      {children}
      <button type="button" className={styles.btn} onClick={() => inputRef.current?.click()}>
        {label || '📷 Upload photo'}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} hidden />
    </div>
  );
}
