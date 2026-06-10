import { accentGradient } from '../utils/color';
import styles from './UserPlate.module.css';

export default function UserPlate({ name, accentColor, size = 'md', className = '' }) {
  const color = accentColor || '#5865f2';
  const sizeClass = styles[size] || styles.md;

  return (
    <span
      className={`${styles.plate} ${sizeClass} ${className}`}
      style={{ backgroundImage: accentGradient(color) }}
    >
      {name}
    </span>
  );
}
