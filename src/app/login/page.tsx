import Link from "next/link";
import { signIn, signUp } from "../actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      {error && <p className="err">{error}</p>}
      <div className="card">
        <h3>Giriş</h3>
        <form action={signIn} className="stack">
          <input name="email" type="email" placeholder="E-posta" required />
          <input name="password" type="password" placeholder="Şifre" required />
          <button>Giriş yap</button>
        </form>
      </div>
      <div className="card">
        <h3>Kayıt</h3>
        <form action={signUp} className="stack">
          <input name="username" placeholder="Kullanıcı adı (3-24, harf/rakam/_)" pattern="[a-zA-Z0-9_]{3,24}" required />
          <input name="email" type="email" placeholder="E-posta" required />
          <input name="password" type="password" placeholder="Şifre (min 8)" minLength={8} required />
          <label className="row">
            <input type="checkbox" name="accept" />
            <span>
              <Link href="/rules">Kuralları</Link> okudum. 18 yaşından büyüğüm, paylaştığım her içeriğin
              hukuki sorumluluğunun bana ait olduğunu kabul ediyorum.
            </span>
          </label>
          <button>Kayıt ol</button>
        </form>
      </div>
    </>
  );
}
