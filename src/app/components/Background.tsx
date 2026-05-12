"use client";

import styles from "./background.module.css";

export default function Background() {
  return (
    <div className={styles.bg} aria-hidden="true">
      {/* Global noise overlay */}
      <div className={styles.noise} />
    </div>
  );
}
