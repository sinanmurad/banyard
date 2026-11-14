import Link from "next/link";
import { submitReport } from "../actions";

export const metadata = { title: "Report content — Banyard" };

export default async function Report({
  searchParams,
}: { searchParams: Promise<{ post_id?: string; comment_id?: string; sent?: string; error?: string }> }) {
  const q = await searchParams;
  return (
    <>
      <h2>Report content / takedown</h2>
      <p className="mute">
        You can report without logging in. Valid reports of child sexual abuse material and
        non-consensual intimate imagery are removed within 48 hours. <Link href="/rules">Rules</Link>
      </p>
      {q.sent && <p className="ok">Your report has been received.</p>}
      {q.error && <p className="err">{q.error}</p>}
      <form action={submitReport} className="stack card">
        <input name="post_id" placeholder="Post ID" defaultValue={q.post_id ?? ""} />
        <input name="comment_id" placeholder="Comment ID" defaultValue={q.comment_id ?? ""} />
        <select name="category" required defaultValue="">
          <option value="" disabled>Select a category</option>
          <option value="csam">Child sexual abuse material</option>
          <option value="non_consensual_intimate">Non-consensual intimate imagery / deepfake</option>
          <option value="violence">Incitement to violence / threats</option>
          <option value="drugs_weapons">Drugs / weapons</option>
          <option value="illegal">Other illegal content</option>
          <option value="other">Other</option>
        </select>
        <textarea name="details" placeholder="Details" />
        <input name="email" type="email" placeholder="Email (optional, so we can reply)" />
        <button>Submit</button>
      </form>
    </>
  );
}
