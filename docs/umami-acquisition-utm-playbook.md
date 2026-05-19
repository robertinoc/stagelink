# Umami Acquisition UTM Playbook

Status: PR 2 conventions for StageLink Behind acquisition operations.

## Scope

Umami remains scoped to `behind.stagelink.art`.

This playbook standardizes campaign links for WhatsApp, email invitations,
Instagram DMs, referrals, and manual outreach. The Behind Umami website measures
internal acquisition operations such as opening and sending invitations. It does
not measure public visitor sessions on `stagelink.art/signup`, landing pages,
artist pages, or artist dashboards.

If StageLink later needs visitor-side UTM validation on public signup or landing
pages, create a separate product/privacy review for a public analytics scope or
another Umami website.

## UTM Convention

Use lowercase snake_case values.

| Parameter      | Meaning                      | Examples                                               |
| -------------- | ---------------------------- | ------------------------------------------------------ |
| `utm_source`   | Channel or origin            | `whatsapp`, `email`, `instagram_dm`, `manual_outreach` |
| `utm_medium`   | Contact type                 | `direct_message`, `email_invite`, `referral`           |
| `utm_campaign` | Campaign or acquisition wave | `behind_invites_2026_q2`, `artist_beta_round_1`        |
| `utm_content`  | Variant, audience, segment   | `artist_beta`, `pro_lead`, `friend_referral`           |

Recommended first campaign:

```text
utm_campaign=behind_invites_2026_q2
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
https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=behind_invites_2026_q2&utm_content=artist_beta
```

Email invite follow-up:

```text
https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=behind_invites_2026_q2&utm_content=pro_lead
```

Referral:

```text
https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=behind_invites_2026_q2&utm_content=friend_referral
```

## Contact And Link Table

Copy this table to Sheets, Notion, or a CSV before outreach.

| Contact label   | Channel  | Source            | Medium           | Campaign                 | Content           | Link                                                                                                                                             | Sent at | Result |
| --------------- | -------- | ----------------- | ---------------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------ |
| artist_beta_001 | WhatsApp | `whatsapp`        | `direct_message` | `behind_invites_2026_q2` | `artist_beta`     | `https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=behind_invites_2026_q2&utm_content=artist_beta`      |         |        |
| pro_lead_001    | Email    | `email`           | `email_invite`   | `behind_invites_2026_q2` | `pro_lead`        | `https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=behind_invites_2026_q2&utm_content=pro_lead`              |         |        |
| referral_001    | Manual   | `manual_outreach` | `referral`       | `behind_invites_2026_q2` | `friend_referral` | `https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=behind_invites_2026_q2&utm_content=friend_referral` |         |        |

CSV starter:

```csv
contact_label,channel,utm_source,utm_medium,utm_campaign,utm_content,link,sent_at,result
artist_beta_001,WhatsApp,whatsapp,direct_message,behind_invites_2026_q2,artist_beta,https://stagelink.art/es/signup?utm_source=whatsapp&utm_medium=direct_message&utm_campaign=behind_invites_2026_q2&utm_content=artist_beta,,
pro_lead_001,Email,email,email_invite,behind_invites_2026_q2,pro_lead,https://stagelink.art/es/signup?utm_source=email&utm_medium=email_invite&utm_campaign=behind_invites_2026_q2&utm_content=pro_lead,,
referral_001,Manual,manual_outreach,referral,behind_invites_2026_q2,friend_referral,https://stagelink.art/es/signup?utm_source=manual_outreach&utm_medium=referral&utm_campaign=behind_invites_2026_q2&utm_content=friend_referral,,
```

## Behind Umami Events

Behind tracks the internal invitation funnel with safe metadata only:

- `behind_invite_opened`
- `behind_invitation_submitted`
- `behind_invitation_sent`
- `behind_invitation_failed`

Allowed event properties:

- `surface=users_table`
- `channel=workos_email`
- `source=behind_users`
- `medium=email_invite`
- `result=sent|api_error|network_error`
- `status=<http_status>` for API errors only

Never send email, name, handle, user id, artist id, search text, or free-text
outreach content to Umami.
