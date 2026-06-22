"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DownloadDropdown.module.css";

const FILES = [
  {
    label: "Installer (.setup)",
    sub: "Установщик с ярлыком",
    href: "/Interview Assistant_0.1.0_x64-setup.exe",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v13M5 15l7 7 7-7" /><path d="M3 21h18" />
      </svg>
    ),
  },
  {
    label: "Portable (.exe)",
    sub: "Запуск без установки",
    href: "/IntrviwAssistant.exe",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
];

interface Props {
  trigger: React.ReactNode;
  align?: "left" | "right" | "center";
}

export default function DownloadDropdown({ trigger, align = "center" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <div onClick={() => setOpen((v) => !v)} className={styles.trigger}>
        {trigger}
      </div>
      {open && (
        <div className={`${styles.dropdown} ${styles[align]}`}>
          <div className={styles.dropdownLabel}>Выберите версию</div>
          {FILES.map((f) => (
            <a
              key={f.href}
              href={f.href}
              download
              className={styles.item}
              onClick={() => setOpen(false)}
            >
              <span className={styles.itemIcon}>{f.icon}</span>
              <span className={styles.itemText}>
                <span className={styles.itemLabel}>{f.label}</span>
                <span className={styles.itemSub}>{f.sub}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
