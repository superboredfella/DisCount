import { isImageUrl } from '../utils/image';
import { accentGradient, accentGradientSoft } from '../utils/color';
import styles from './Avatar.module.css';

export default function Avatar({ value, size = 'md', accentColor, className = '', status, gradient = false }) {
  const sizeClass = styles[size] || styles.md;
  const isImg = isImageUrl(value);
  const color = accentColor || '#5865f2';

  const bgStyle = isImg
    ? { background: 'transparent' }
    : gradient
      ? { background: accentGradientSoft(color) }
      : { background: color + '33' };

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${gradient ? styles.gradient : ''} ${className}`}
      style={{
        ...bgStyle,
        ...(gradient && !isImg ? { '--ring-gradient': accentGradient(color) } : {}),
      }}
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
