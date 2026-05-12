import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Assistant — ИИ-ассистент для собеседований",
  description: "Интегрируется в вашу IDE. Готовьтесь к техническим интервью с ИИ в реальном времени.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
