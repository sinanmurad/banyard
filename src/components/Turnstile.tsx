import Script from "next/script";

// Cloudflare Turnstile bot check. Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
// The widget adds a hidden "cf-turnstile-response" field to the surrounding form.
export function Turnstile() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={key} data-theme="dark" />
    </>
  );
}
