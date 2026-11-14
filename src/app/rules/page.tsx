import Link from "next/link";

export const metadata = { title: "Kurallar ve sorumluluk — Agora" };

export default function Rules() {
  const mail = process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "legal@example.com";
  return (
    <>
      <h2>Kurallar ve sorumluluk</h2>

      <div className="card">
        <h3>Temel ilke</h3>
        <p>
          Agora'da yasalar çerçevesinde her konu konuşulabilir: sert görüşler, tartışmalı fikirler,
          siyaset, eleştiri ve yetişkinlere yönelik (18+) metin içerik serbesttir. Yasaklar yalnızca
          suç oluşturan veya başkasına doğrudan zarar veren içerikle sınırlıdır.
        </p>
      </div>

      <div className="card warn">
        <h3>Kesinlikle yasak içerik</h3>
        <ul>
          <li>18 yaşından küçüklerin cinsel içerikli her türlü gösterimi veya çocuk istismarı (anında silinir, yetkililere bildirilir).</li>
          <li>Rızası olmayan kişilerin mahrem görüntüleri, intikam pornosu, yapay zekâ ile üretilmiş sahte mahrem görüntüler (deepfake).</li>
          <li>Şiddet çağrısı, şiddet tehdidi, terör propagandası, bir kişiyi veya grubu hedef alan şiddete teşvik.</li>
          <li>Uyuşturucu, silah ve patlayıcı satışı, temini veya üretim talimatı.</li>
          <li>Dolandırıcılık, kimlik hırsızlığı, çalıntı veri, hesap veya kart satışı.</li>
          <li>İnsan ticareti, zorla çalıştırma, fuhşa aracılık.</li>
          <li>Kişisel verilerin (adres, telefon, kimlik) rıza olmadan yayımlanması (doxxing), takip ve tacizin organize edilmesi.</li>
          <li>Telif hakkı ihlali ve kötü amaçlı yazılım dağıtımı.</li>
          <li>Yürürlükteki yasalara göre suç oluşturan diğer her içerik.</li>
        </ul>
      </div>

      <div className="card warn">
        <h3>Sorumluluk beyanı</h3>
        <p>
          Paylaşılan her içeriğin <b>hukuki ve cezai sorumluluğu yalnızca içeriği paylaşan kullanıcıya
          aittir</b>. Agora bir barındırma hizmetidir; içerikleri yayımlanmadan önce incelemez, içeriklerin
          doğruluğunu, yasallığını veya uygunluğunu garanti etmez. Kullanıcı, kayıt olarak şunları kabul eder:
        </p>
        <ul>
          <li>18 yaşından büyük olduğunu.</li>
          <li>Paylaştığı içeriğin yasal olduğunu ve paylaşma hakkına sahip olduğunu.</li>
          <li>Suç oluşturan içerik nedeniyle doğacak her türlü talep, dava ve cezadan kendisinin sorumlu olduğunu.</li>
          <li>Yasa gereği gerektiğinde kimlik ve kayıt bilgilerinin yetkili makamlarla paylaşılabileceğini.</li>
        </ul>
      </div>

      <div className="card">
        <h3>18+ içerik</h3>
        <p>
          Yetişkin içerik "18+" olarak işaretlenmelidir ve varsayılan olarak gizli gelir. Bu sürümde yalnızca
          metin ve bağlantı paylaşılır. Gerçek kişileri gösteren görsel/video yükleme, yaş ve kimlik doğrulaması
          ile rıza belgesi altyapısı kurulana kadar açık değildir.
        </p>
      </div>

      <div className="card">
        <h3>Bildirim ve kaldırma</h3>
        <p>
          Yasa dışı olduğunu düşündüğünüz içeriği <Link href="/report">buradan bildirebilirsiniz</Link>.
          Çocuk istismarı ve rızasız mahrem görüntü bildirimleri öncelikli işlenir ve geçerli bir talepte
          en geç 48 saat içinde kaldırılır. Hukuki başvurular: <a href={`mailto:${mail}`}>{mail}</a>
        </p>
      </div>
    </>
  );
}
