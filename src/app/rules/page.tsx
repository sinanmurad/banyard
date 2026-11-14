import Link from "next/link";

export const metadata = { title: "Rules & responsibility — Banyard" };

export default function Rules() {
  const mail = process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "legal@example.com";
  return (
    <>
      <h2>Rules &amp; responsibility</h2>

      <div className="card">
        <h3>Core principle</h3>
        <p>
          Anything legal can be discussed on Banyard: harsh opinions, controversial ideas, politics,
          criticism and adult (18+) text content are all allowed. The only restrictions are on content
          that is a crime or directly harms others.
        </p>
      </div>

      <div className="card warn">
        <h3>Strictly prohibited content</h3>
        <ul>
          <li>Any sexualized depiction of minors or child abuse material (removed immediately and reported to the authorities).</li>
          <li>Intimate images of people without their consent, revenge porn, and AI-generated fake intimate images (deepfakes).</li>
          <li>Calls to violence, threats of violence, terrorist propaganda, and incitement against a person or group.</li>
          <li>Selling, sourcing or giving production instructions for drugs, weapons and explosives.</li>
          <li>Fraud, identity theft, stolen data, and the sale of accounts or cards.</li>
          <li>Human trafficking, forced labor, and facilitation of prostitution.</li>
          <li>Publishing personal data (address, phone, ID) without consent (doxxing), and organizing stalking or harassment.</li>
          <li>Copyright infringement and distribution of malware.</li>
          <li>Any other content that constitutes a crime under applicable law.</li>
        </ul>
      </div>

      <div className="card warn">
        <h3>Responsibility statement</h3>
        <p>
          <b>The legal and criminal responsibility for any content lies solely with the user who posts it.</b>{" "}
          Banyard is a hosting service. It does not review content before publication and does not
          guarantee its accuracy, legality or suitability. By signing up, users agree that:
        </p>
        <ul>
          <li>They are 18 years of age or older.</li>
          <li>The content they post is legal and they have the right to share it.</li>
          <li>They alone are responsible for any claim, lawsuit or penalty arising from unlawful content they post.</li>
          <li>Their identity and account data may be disclosed to the authorities where the law requires it.</li>
        </ul>
      </div>

      <div className="card">
        <h3>18+ content</h3>
        <p>
          Adult content must be marked &quot;18+&quot; and is hidden by default. In this version only text and
          links can be shared. Uploading images or video of real people stays disabled until age and
          identity verification and consent records are in place.
        </p>
      </div>

      <div className="card">
        <h3>Reporting and removal</h3>
        <p>
          You can <Link href="/report">report content here</Link> if you believe it is illegal. Reports of
          child abuse material and non-consensual intimate imagery are prioritized and, if valid, removed
          within 48 hours. Legal requests: <a href={`mailto:${mail}`}>{mail}</a>
        </p>
      </div>
    </>
  );
}
