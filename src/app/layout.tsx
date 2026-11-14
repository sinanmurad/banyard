import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/supabase";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Banyard",
  description: "Yasalar çerçevesinde her şeyin konuşulabildiği açık kaynak forum.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="tr">
      <body>
        <header>
          <Link href="/" className="brand">Banyard</Link>
          <Link href="/c/new">Topluluk aç</Link>
          <span className="spacer" />
          {user ? (
            <form action={signOut}><button className="ghost">Çıkış</button></form>
          ) : (
            <Link href="/login">Giriş / Kayıt</Link>
          )}
        </header>
        <main>{children}</main>
        <footer>
          <Link href="/rules">Kurallar ve sorumluluk</Link>
          <Link href="/report">İçerik bildir / takedown</Link>
          <a href="https://github.com/">Açık kaynak (MIT)</a>
        </footer>
      </body>
    </html>
  );
}
