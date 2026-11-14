import Link from "next/link";
import { signIn, signUp } from "../actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      {error && <p className="err">{error}</p>}
      <div className="card">
        <h3>Log in</h3>
        <form action={signIn} className="stack">
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button>Log in</button>
        </form>
      </div>
      <div className="card">
        <h3>Sign up</h3>
        <form action={signUp} className="stack">
          <input name="username" placeholder="Username (3-24, letters/digits/_)" pattern="[a-zA-Z0-9_]{3,24}" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password (min 8)" minLength={8} required />
          <label className="row">
            <input type="checkbox" name="accept" />
            <span>
              I have read the <Link href="/rules">rules</Link>. I am 18 or older and I accept that I am
              legally responsible for everything I post.
            </span>
          </label>
          <button>Sign up</button>
        </form>
      </div>
    </>
  );
}
