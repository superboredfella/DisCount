import { isImageUrl } from '../utils/image';
import styles from './Avatar.module.css';

export default function Avatar({ value, size = 'md', accentColor, className = '', status }) {
  const sizeClass = styles[size] || styles.md;
  const isImg = isImageUrl(value);

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${className}`}
      style={{ background: isImg ? 'transparent' : (accentColor || '#5865f2') + '33' }}
    >
      {isImg ? (
        <img src={value} alt="" className={styles.img} />
      ) : (
        <span className={styles.emoji}>{value || '😊'}</span>
      )}
      {status && <span className={styles.status} style={{ background: status }} />}
    </div>
  );
}
