import { joinWaitlist } from "../actions";

export const metadata = { title: "AI answers that stay current — waiting list" };

export default async function AiWaitlist({
  searchParams,
}: { searchParams: Promise<{ joined?: string; error?: string }> }) {
  const { joined, error } = await searchParams;
  return (
    <>
      <h2>AI answers that stay current</h2>
      <p>
        Forums bury the best answers in a day. We are building a community app where people who
        know AI share what works, and everyone else finds the answer to &quot;which tool should I use for
        this?&quot; fast. Every answer shows which model it was tested on, and is marked outdated when a
        better model arrives.
      </p>
      <ul>
        <li>Answers organised by task, not by thread date</li>
        <li>Community-verified, with &quot;still works&quot; votes</li>
        <li>Alerts when a tool you follow changes</li>
      </ul>
      {joined ? (
        <p className="card">You are on the list. Thank you! We will email you once, when the app is ready.</p>
      ) : (
        <form action={joinWaitlist} className="stack">
          {error && <p className="err">{error}</p>}
          <input name="email" type="email" placeholder="Your email" required maxLength={254} />
          <input name="interest" placeholder="What do you most want to find out about AI? (optional)" maxLength={300} />
          <button>Join the waiting list</button>
        </form>
      )}
      <p className="mute">No spam. One email when it launches.</p>
    </>
  );
}
