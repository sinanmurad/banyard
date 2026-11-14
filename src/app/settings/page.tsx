import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/supabase";
import { updateProfile, updatePassword, deleteAccount } from "../actions";

export const metadata = { title: "Settings — Banyard" };

export default async function Settings({
  searchParams,
}: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await currentProfile();
  if (!me) redirect("/login");
  const { error, saved } = await searchParams;
  const p = me.profile;

  return (
    <>
      <h2>Settings</h2>
      {error && <p className="err">{error}</p>}
      {saved && <p className="ok">Saved.</p>}

      <div className="card">
        <h3>Your profile</h3>
        <p className="mute">
          Username: <b>{p.username}</b> · <Link href={`/u/${p.username}`}>View public profile</Link>
        </p>
        <form action={updateProfile} className="stack">
          <label>Display name (optional)
            <input name="display_name" defaultValue={p.display_name ?? ""} maxLength={40} placeholder="How your name appears next to your posts" />
          </label>
          <label>About you (optional)
            <textarea name="bio" defaultValue={p.bio} maxLength={300} placeholder="A short bio, max 300 characters" />
          </label>
          <label>Default sorting
            <select name="default_sort" defaultValue={p.default_sort}>
              <option value="hot">Hot — popular right now</option>
              <option value="new">New — newest first</option>
              <option value="top">Top — most votes</option>
            </select>
          </label>
          <label className="row">
            <input type="checkbox" name="show_nsfw" defaultChecked={p.show_nsfw} />
            <span>Show 18+ posts without asking each time (I am 18 or older)</span>
          </label>
          <button>Save changes</button>
        </form>
      </div>

      <div className="card">
        <h3>Change password</h3>
        <form action={updatePassword} className="stack">
          <input name="password" type="password" minLength={8} placeholder="New password (min 8)" required />
          <button>Update password</button>
        </form>
      </div>

      <div className="card warn">
        <h3>Delete account</h3>
        <p className="mute">
          This permanently deletes your account, posts, comments and votes. It cannot be undone.
        </p>
        <form action={deleteAccount} className="stack">
          <input name="confirm" placeholder="Type DELETE to confirm" required />
          <button className="ghost">Delete my account</button>
        </form>
      </div>
    </>
  );
}
