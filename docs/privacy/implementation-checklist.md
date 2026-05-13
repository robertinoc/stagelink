# Privacy Implementation Checklist

Status: missing information and implementation backlog for the Privacy Plan.

## Legal Inputs Needed

- Final StageLink legal entity name.
- Legal address.
- Privacy contact email.
- Support/DSAR email.
- Governing law and dispute venue.
- Whether StageLink will appoint a DPO or EU representative.
- Whether StageLink will offer a DPA to artists.
- Final minimum age and guardian-consent posture.
- Final refund/cancellation policy for paid plans.

## Product/Technical Inputs Needed

- Final analytics stack: PostHog, Umami, both, or one.
- Production region for Railway DB/API.
- Storage provider and region.
- Email provider for contact/transactional mail.
- Whether public contact forms store messages or only send email.
- Whether subscriber/fan exports exist at launch.
- Whether account deletion is soft-delete only or hard-delete/anonymization.
- Retention periods by data category.
- Whether marketing emails are planned at launch.

## Implementation Backlog

### Critical Before Public Launch

- Publish lawyer-reviewed Privacy Policy.
- Publish lawyer-reviewed Terms of Service.
- Publish lawyer-reviewed Cookie Policy.
- Implement consent banner with Reject non-essential and Manage choices.
- Block non-essential analytics/tracking before consent where required.
- Define manual DSAR process at minimum: access, correction, deletion,
  portability, consent withdrawal.
- Define account deletion behavior and subscriber deletion routing.
- Confirm provider DPAs/SCCs and production regions.

### High Before Paid Growth

- Build self-service data export.
- Build self-service account deletion or verified deletion request flow.
- Implement retention/anonymization jobs for analytics and deleted accounts.
- Add subscriber unsubscribe/delete support.
- Add privacy settings page.
- Document incident/data breach process with 72-hour GDPR assessment workflow.

### Medium

- Add Global Privacy Control support if marketing/analytics expands.
- Add consent versioning and audit history.
- Add privacy review checklist for new integrations.
- Add periodic data inventory review.
- Add Spanish translation of public legal documents.

## Documentation Maintenance Rule

Any feature that adds a new personal data category, provider, integration,
tracking event, cookie, export, or admin access path must update:

- `data-inventory.md`
- `providers-and-transfers.md`
- `compliance-gap-analysis.md`
- Relevant public policy structure
