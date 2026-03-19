// src/components/Toast.js

import { useApp } from '../hooks/useApp';
import styles from './Toast.module.css';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div className={`${styles.toast} ${toast.visible ? styles.show : ''}`}>
      <span className={styles.dot} />
      <span className={styles.msg}>{toast.msg}</span>
    </div>
  );
}
