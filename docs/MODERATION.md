# Moderasyon ve takedown süreci

Agora'yı kendi sunucunuzda çalıştıran kişi **işletmecidir** ve yasal yükümlülükler ona aittir.

## Rapor kuyruğu
Bildirimler `reports` tablosuna düşer (yalnızca service role / Supabase dashboard okuyabilir).

```sql
select * from reports where status = 'open' order by created_at;
```

## Öncelik
| Kategori | Süre |
|---|---|
| `csam` | Hemen kaldır, yetkili makama bildir |
| `non_consensual_intimate` | En geç 48 saat (ABD Take It Down Act) |
| `violence`, `drugs_weapons`, `illegal` | Mümkün olan en kısa sürede |

## İçerik kaldırma
```sql
update posts set removed = true where id = '<id>';
update comments set removed = true where id = '<id>';
update reports set status = 'actioned' where id = '<rapor-id>';
```

## Yapılması gerekenler (kendi sitenizi açıyorsanız)
- `NEXT_PUBLIC_LEGAL_EMAIL` değerini gerçek bir adrese ayarlayın.
- Bulunduğunuz ülkedeki yasal yükümlülükleri (ör. Türkiye 5651, AB DSA, İngiltere Online Safety Act, ABD Take It Down Act) bir avukata danıştırın.
- Görsel/video yükleme eklemeden önce yaş doğrulama, yükleyen kimlik doğrulama ve rıza belgesi altyapısını kurun. Ödeme kuruluşları (Visa/Mastercard) bunu şart koşar.
- Bu proje hukuki danışmanlık değildir.
