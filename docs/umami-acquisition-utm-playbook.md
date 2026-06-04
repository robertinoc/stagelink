# Umami Acquisition UTM Playbook

Status: conventions for StageLink Platform acquisition campaigns.

## Scope

Umami platform tracking is scoped to `stagelink.art`.

This playbook standardizes campaign links for WhatsApp, email invitations,
Instagram DMs, referrals, and manual outreach. The StageLink Platform Umami
website measures visitor sessions on landing, signup, onboarding, and dashboard
routes after analytics consent.

Public artist page tracking remains out of scope for this Umami website in v1.

## UTM Convention

Use lowercase snake_case values.

| Parameter      | Meaning                      | Examples                                               |
| -------------- | ---------------------------- | ------------------------------------------------------ |
| `utm_source`   | Channel or origin            | `whatsapp`, `email`, `instagram_dm`, `manual_outreach` |
| `utm_medium`   | Contact type                 | `direct_message`, `email_invite`, `referral`           |
| `utm_campaign` | Campaign or acquisition wave | `stagelink_growth_2026_q2`, `artist_beta_round_1`      |
| `utm_content`  | Variant, audience, segment   | `artist_beta`, `pro_lead`, `friend_referral`           |

Recommended first campaign:

```text
utm_campaign=stagelink_growth_2026_q2
```

## Link Templates

Signup:

```text
https://stagelink.art/es/signup?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
```

Landing:

```text
https://stagelink.art/?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
```

WhatsApp:

```text
Hola {first_name}, te paso StageLink para que puedas probarlo:
https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=stagelink_growth_2026_q2&utm_content=artist_beta
```

Email invite follow-up:

```text
https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=stagelink_growth_2026_q2&utm_content=pro_lead
```

Referral:

```text
https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=stagelink_growth_2026_q2&utm_content=friend_referral
```

## Contact And Link Table

Copy this table to Sheets, Notion, or a CSV before outreach.

| Contact label   | Channel  | Source            | Medium           | Campaign                   | Content           | Link                                                                                                                                               | Sent at | Result |
| --------------- | -------- | ----------------- | ---------------- | -------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| artist_beta_001 | WhatsApp | `whatsapp`        | `direct_message` | `stagelink_growth_2026_q2` | `artist_beta`     | `https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=stagelink_growth_2026_q2&utm_content=artist_beta`      |         |        |
| pro_lead_001    | Email    | `email`           | `email_invite`   | `stagelink_growth_2026_q2` | `pro_lead`        | `https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=stagelink_growth_2026_q2&utm_content=pro_lead`              |         |        |
| referral_001    | Manual   | `manual_outreach` | `referral`       | `stagelink_growth_2026_q2` | `friend_referral` | `https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=stagelink_growth_2026_q2&utm_content=friend_referral` |         |        |

CSV starter:

```csv
contact_label,channel,utm_source,utm_medium,utm_campaign,utm_content,link,sent_at,result
artist_beta_001,WhatsApp,whatsapp,direct_message,stagelink_growth_2026_q2,artist_beta,https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=stagelink_growth_2026_q2&utm_content=artist_beta,,
pro_lead_001,Email,email,email_invite,stagelink_growth_2026_q2,pro_lead,https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=stagelink_growth_2026_q2&utm_content=pro_lead,,
referral_001,Manual,manual_outreach,referral,stagelink_growth_2026_q2,friend_referral,https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=stagelink_growth_2026_q2&utm_content=friend_referral,,
```

## Platform Umami Events

StageLink Platform tracks acquisition intent and confirmed signup conversion
with safe metadata only:

- `auth_signup_started`
- `auth_signup_completed`
- `auth_signup_login_clicked`
- `auth_login_started`
- `auth_login_signup_clicked`

Current explicit `auth_*` event properties:

- `locale`
- `surface`, limited to `signup` or `login`
- `environment`

`auth_signup_completed` is emitted only after a new internal StageLink account
returns from hosted signup to onboarding or the authenticated dashboard. It does
not include WorkOS identifiers or account data.

Umami reads `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` from
the campaign URL/session. Do not copy contact-table identifiers or outreach
notes into explicit event properties.

Never send email, name, handle, user id, artist id, search text, or free-text
outreach content to Umami.
