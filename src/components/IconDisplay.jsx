import { isImageUrl } from '../utils/image';
import styles from './IconDisplay.module.css';

export default function IconDisplay({ value, size = 'md', className = '' }) {
  const sizeClass = styles[size] || styles.md;

  if (isImageUrl(value)) {
    return <img src={value} alt="" className={`${styles.img} ${sizeClass} ${className}`} />;
  }

  return <span className={`${styles.emoji} ${sizeClass} ${className}`}>{value || '🏠'}</span>;
}
