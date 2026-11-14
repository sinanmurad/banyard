# Moderation and takedown process

Whoever runs a Banyard instance is the **operator** and carries the legal obligations.

## Report queue
Reports land in the `reports` table (readable only by admins and the service role).
Admins see them on the `/admin` page, where "Remove content" and "Dismiss" buttons are available.
To make someone an admin:

```sql
update profiles set is_admin = true where username = 'your_username';
```

The same can be done in SQL:

```sql
select * from reports where status = 'open' order by created_at;
```

## Priority
| Category | Deadline |
|---|---|
| `csam` | Remove immediately, report to the competent authority |
| `non_consensual_intimate` | Within 48 hours at most (US Take It Down Act) |
| `violence`, `drugs_weapons`, `illegal` | As soon as possible |

## Removing content
```sql
update posts set removed = true where id = '<id>';
update comments set removed = true where id = '<id>';
update reports set status = 'actioned' where id = '<report-id>';
```

## Before you run a public instance
- Set `NEXT_PUBLIC_LEGAL_EMAIL` to a real address.
- Get legal advice on the obligations in your country and your users' countries (e.g. EU DSA, UK Online Safety Act, US Take It Down Act, local internet laws). Consider operating through a legal entity in a suitable jurisdiction.
- Before adding image/video upload, build age verification, uploader identity verification and consent records. Card networks (Visa/Mastercard) require this for adult content.
- This project is not legal advice.
