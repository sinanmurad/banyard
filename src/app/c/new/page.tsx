import { createCommunity } from "../../actions";

export default async function NewCommunity({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="card">
      <h3>Create community</h3>
      {error && <p className="err">{error}</p>}
      <form action={createCommunity} className="stack">
        <input name="slug" placeholder="address (lowercase letters, digits, _)" pattern="[a-z0-9_]{3,24}" required />
        <input name="title" placeholder="Title" required />
        <textarea name="description" placeholder="Description" />
        <button>Create</button>
      </form>
    </div>
  );
}
