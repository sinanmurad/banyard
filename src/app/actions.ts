"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, currentUser } from "@/lib/supabase";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const fail = (path: string, msg: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);

const captcha = (f: FormData) => s(f, "cf-turnstile-response") || undefined;

export async function signUp(f: FormData) {
  if (f.get("accept") !== "on") fail("/login", "You must accept the rules and the responsibility statement.");
  const supabase = await db();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: s(f, "email"),
    password: s(f, "password"),
    options: {
      data: { username: s(f, "username") },
      captchaToken: captcha(f),
      emailRedirectTo: `${site}/auth/callback`,
    },
  });
  if (error) fail("/login", error.message);
  // With "Confirm email" enabled there is no session until the link is clicked.
  if (!data.session) redirect("/login?notice=" + encodeURIComponent("Check your email and click the confirmation link."));
  redirect("/");
}

export async function signIn(f: FormData) {
  const supabase = await db();
  const { error } = await supabase.auth.signInWithPassword({
    email: s(f, "email"),
    password: s(f, "password"),
    options: { captchaToken: captcha(f) },
  });
  if (error) fail("/login", error.message);
  redirect("/");
}

export async function signOut() {
  const supabase = await db();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createCommunity(f: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  const slug = s(f, "slug").toLowerCase();
  const { error } = await supabase
    .from("communities")
    .insert({ slug, title: s(f, "title"), description: s(f, "description"), created_by: user.id });
  if (error) fail("/c/new", error.message);
  redirect(`/c/${slug}`);
}

export async function createPost(f: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const slug = s(f, "slug");
  const supabase = await db();
  const { data: c } = await supabase.from("communities").select("id").eq("slug", slug).single();
  if (!c) fail("/", "Community not found.");
  const { data, error } = await supabase
    .from("posts")
    .insert({
      community_id: c!.id,
      author_id: user.id,
      title: s(f, "title"),
      body: s(f, "body"),
      is_nsfw: f.get("nsfw") === "on",
    })
    .select("id")
    .single();
  if (error) fail(`/c/${slug}`, error.message);
  redirect(`/p/${data!.id}`);
}

export async function createComment(f: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const postId = s(f, "post_id");
  const supabase = await db();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body: s(f, "body") });
  if (error) fail(`/p/${postId}`, error.message);
  revalidatePath(`/p/${postId}`);
  redirect(`/p/${postId}`);
}

export async function vote(f: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const postId = s(f, "post_id");
  const value = Number(f.get("value")) === -1 ? -1 : 1;
  const supabase = await db();
  const { data: existing } = await supabase
    .from("votes")
    .select("value")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.value === value) {
    await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("votes").upsert({ post_id: postId, user_id: user.id, value });
  }
  revalidatePath(`/p/${postId}`);
  redirect(`/p/${postId}`);
}

export async function submitReport(f: FormData) {
  const supabase = await db();
  const postId = s(f, "post_id") || null;
  const commentId = s(f, "comment_id") || null;
  if (!postId && !commentId) fail("/report", "A post ID or comment ID is required to file a report.");
  const { error } = await supabase.from("reports").insert({
    post_id: postId,
    comment_id: commentId,
    category: s(f, "category"),
    details: s(f, "details"),
    reporter_email: s(f, "email") || null,
  });
  if (error) fail("/report", error.message);
  redirect("/report?sent=1");
}

export async function deletePost(f: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  await supabase.from("posts").delete().eq("id", s(f, "post_id")).eq("author_id", user.id);
  redirect("/");
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) redirect("/");
  return supabase;
}

// Admin: removes the reported content and marks the report as actioned.
export async function removeReported(f: FormData) {
  const supabase = await requireAdmin();
  const postId = s(f, "post_id");
  const commentId = s(f, "comment_id");
  if (postId) await supabase.from("posts").update({ removed: true }).eq("id", postId);
  if (commentId) await supabase.from("comments").update({ removed: true }).eq("id", commentId);
  await supabase.from("reports").update({ status: "actioned" }).eq("id", s(f, "report_id"));
  revalidatePath("/admin");
  redirect("/admin");
}

export async function dismissReport(f: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("reports").update({ status: "dismissed" }).eq("id", s(f, "report_id"));
  revalidatePath("/admin");
  redirect("/admin");
}
