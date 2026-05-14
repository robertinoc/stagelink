# International Transfers Validation Audit

Status: validation audit for Privacy Plan international transfer work.
Date: 2026-05-14

Scope reviewed:

- `docs/privacy/providers-and-transfers.md`
- `docs/privacy/third-party-processors.md`
- `docs/privacy/provider-compliance-matrix.md`
- `docs/privacy/external-data-flows.md`
- `docs/privacy/international-transfer-impact-assessment.md`
- `docs/privacy/compliance-gap-analysis.md`
- current integration, consent, DSAR, retention, and privacy-by-design docs

This is not legal advice. It is a privacy engineering validation of whether
StageLink has a usable operational baseline for international data transfers.

## 1. Transfer Inventory Audit

Result: good coverage of expected international transfers.

Strong coverage:

- global infrastructure, auth, payment, analytics, email, storage, CI/CD,
  embeds, and artist-configured provider APIs are included;
- routine transfers are treated as likely, not exceptional;
- public embeds and browser-side providers are recognized as direct visitor
  exposure paths.

Gap:

- exact production regions are still missing for several active providers;
- object-storage provider is still generic in the evidence layer;
- provider support-access and subprocessor countries are not captured locally.

Severity: High before public launch.

## 2. Transfer Mechanism Audit

Result: legally coherent as an engineering baseline.

Good:

- adequacy, SCCs/equivalent terms, Data Privacy Framework certification, and
  supplementary measures are treated as provider-specific evidence;
- Article 49 derogations are explicitly not the routine infrastructure basis;
- the docs avoid claiming that consent alone solves routine cloud transfers.

Gap:

- StageLink has not yet recorded provider-by-provider SCC module, DPF entity
  certification, UK/Swiss addendum posture, or signed DPA location.

Severity: High.

## 3. Supplementary Measures Audit

Result: practical technical controls exist, but evidence is incomplete.

Strong coverage:

- consent gate for StageLink-owned analytics;
- server-only provider secrets;
- no direct card collection;
- token encryption for configured integrations where implemented;
- log minimization rules;
- retention candidate reporting before destructive cleanup;
- tenant-scoped object-storage key strategy.

Gap:

- provider-side encryption, law-enforcement transparency, support access, and
  backup retention are not proven;
- object-storage deletion evidence is still pending.

Severity: Medium to High depending provider.

## 4. US Transfer Audit

Result: cautious posture.

Good:

- the docs do not assume every US provider is covered by the EU-US Data Privacy
  Framework;
- DPF reliance is gated on exact entity certification and relevant scope;
- SCCs and supplementary measures remain necessary unless adequacy or DPF
  certification clearly applies.

Gap:

- no active provider has a recorded DPF certification check in the local
  evidence register.

Severity: High before relying on DPF in public policy or contracts.

## 5. Public Policy Audit

Result: clear policy inputs, not final legal text.

Required policy concepts are now documented:

- data may be processed outside the user's country;
- safeguards include DPAs, SCCs, adequacy decisions, DPF certification where
  applicable, encryption, access controls, and provider reviews;
- Stripe and independent providers may retain data under their own obligations;
- public embeds and outbound links can expose visitor metadata to third
  parties.

Gap:

- final Privacy Policy, Cookie Policy, and Terms remain unreviewed.

Severity: Critical for public launch.

## 6. Provider-Specific Transfer Risk Audit

### High

- EmailJS: browser-side public contact provider; DPA, retention, and
  subprocessor evidence incomplete.
- SoundCloud: official API posture not confirmed for server-side sync.
- Object storage: provider, region, DPA, lifecycle, and deletion behavior not
  finalized in evidence.
- PostHog: project region, retention, IP handling, and DPA evidence incomplete.
- WorkOS/Railway/Vercel: core processors; regions, logs, transfer terms, and
  provider-side deletion support need evidence.

### Medium

- Stripe: strong provider posture, but payment retention and independent
  controller boundaries need public language.
- Resend: active if configured; DPA/retention evidence needed.
- GitHub Actions: artifacts and logs can contain personal data if tests use
  real accounts.
- Shopify/Printful: artist-configured provider tokens and product data require
  narrow scopes and disconnect/delete behavior.

### Low

- Umami: documented as future/unknown, not active.
- Printify: future provider, not active.

## Risk Assessment

### Critical

- Final public legal documents are not lawyer-reviewed.

### High

- Provider evidence register is incomplete.
- Production regions and transfer mechanisms are not captured for all active
  providers.
- EmailJS and SoundCloud launch decisions remain open.
- Object-storage provider/region/lifecycle/deletion evidence is incomplete.
- DPF reliance is not verified provider by provider.

### Medium

- Provider-side DSAR/deletion runbooks are manual and incomplete.
- Public embeds may trigger direct third-party transfers before user
  interaction.
- CI/CD artifacts can include personal data without discipline.
- UK/Swiss transfer addenda are not separately captured.

### Low

- Current StageLink-owned analytics is consent-gated.
- Current Spotify/YouTube flows avoid user OAuth tokens.

## International Transfer Readiness Score

Overall score: 74/100.

| Category                 | Score | Notes                                           |
| ------------------------ | ----: | ----------------------------------------------- |
| Transfer inventory       |    84 | Good provider and flow coverage                 |
| Transfer mechanism model |    80 | Correct decision tree; evidence missing         |
| Supplementary measures   |    76 | Good app controls; provider evidence incomplete |
| Provider evidence        |    50 | Major launch gap                                |
| Public policy inputs     |    78 | Clear content; not final legal text             |
| Operational readiness    |    70 | Runbooks and region checks still pending        |
| High-risk providers      |    66 | EmailJS/SoundCloud/storage/PostHog unresolved   |

## Production Blockers

These block "international-transfer complete" for public launch, not private QA:

1. Complete provider evidence register for active providers.
2. Confirm production data/log regions.
3. Record DPA/SCC/DPF/adequacy evidence per provider.
4. Decide EmailJS and SoundCloud launch posture.
5. Confirm object-storage provider, region, lifecycle, and erasure behavior.
6. Add provider-side DSAR/deletion runbooks.
7. Finalize lawyer-reviewed public policy language.

## Validation Conclusion

The Privacy Plan now has a usable transfer map, transfer-mechanism model,
provider risk register, supplementary-measures baseline, and launch checklist.
It is ready for private QA and legal/business evidence collection. It is not
ready to be represented as public-launch transfer compliant until the evidence
register and public policy review are complete.
