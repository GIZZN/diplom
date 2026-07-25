"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

const GAP = 8;
const MENU_WIDTH = 220;
const VIEWPORT_MARGIN = 12;

interface Props {
  trigger: React.ReactNode;
  align?: "left" | "right" | "center";
}

export default function DownloadDropdown({ trigger, align = "center" }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, flipped: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const trig = wrapRef.current?.getBoundingClientRect();
    if (!trig) return;

    const height = menuRef.current?.offsetHeight ?? 0;
    const below = window.innerHeight - trig.bottom;
    const flipped = below < height + GAP + VIEWPORT_MARGIN && trig.top > below;

    let left =
      align === "left"
        ? trig.left
        : align === "right"
          ? trig.right - MENU_WIDTH
          : trig.left + trig.width / 2 - MENU_WIDTH / 2;

    const max = window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN;
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(max, VIEWPORT_MARGIN));

    setPos({
      top: flipped ? trig.top - height - GAP : trig.bottom + GAP,
      left,
      flipped,
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div onClick={() => setOpen((v) => !v)} className={styles.trigger}>
        {trigger}
      </div>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            className={`${styles.dropdown} ${pos.flipped ? styles.flipped : ""}`}
            style={{ top: pos.top, left: pos.left }}
            role="menu"
          >
            <div className={styles.dropdownLabel}>Выберите версию</div>
            {FILES.map((f) => (
              <a
                key={f.href}
                href={f.href}
                download
                className={styles.item}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <span className={styles.itemIcon}>{f.icon}</span>
                <span className={styles.itemText}>
                  <span className={styles.itemLabel}>{f.label}</span>
                  <span className={styles.itemSub}>{f.sub}</span>
                </span>
              </a>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
