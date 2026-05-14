# Breach Notification Workflow

Status: Privacy Plan - incident and breach response baseline.
Date: 2026-05-14

This workflow is based on GDPR Articles 33 and 34 and EDPB breach-notification
guidance. It is an operational baseline, not legal advice.

## Key Rule

When StageLink becomes aware of a personal-data breach that is likely to result
in a risk to the rights and freedoms of natural persons, StageLink should notify
the relevant supervisory authority without undue delay and, where feasible, not
later than 72 hours after becoming aware.

If the breach is likely to result in a high risk to affected people, StageLink
should also communicate the breach to those people without undue delay, unless a
recognized exception applies and counsel agrees.

## Awareness Time

Record three timestamps:

- detection time: when StageLink first saw an anomaly or report;
- breach awareness time: when StageLink has a reasonable degree of certainty
  that a personal-data breach occurred;
- confirmation time: when scope/root cause is confirmed.

The 72-hour notification clock should be tracked from breach awareness time, not
from full root-cause completion.

## 72-Hour Operating Timeline

| Time from awareness | Action                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0-2 hours           | Assign incident commander, preserve evidence, start breach assessment, contain active exposure if possible.    |
| 2-6 hours           | Identify data categories, affected systems, affected user/tenant estimate, exposure window, likely risk level. |
| 6-12 hours          | Privacy/legal review of authority-notification need; prepare draft authority notification if risk is possible. |
| 12-24 hours         | Continue investigation, update affected count/confidence, contact providers, decide if user notice is likely.  |
| 24-48 hours         | Finalize authority notice or documented no-notice rationale; prepare user/provider communications if needed.   |
| 48-72 hours         | Submit authority notification if required; if incomplete, submit available facts and explain phased updates.   |
| After 72 hours      | Provide updates to authority/users as material facts change; complete remediation and postmortem.              |

## Breach Assessment Decision Tree

1. Did a security or privacy incident occur?
   - If no, document and close as non-breach.
2. Is personal data involved?
   - If no, handle as security/operational incident.
3. Was there accidental or unlawful destruction, loss, alteration,
   unauthorized disclosure, or unauthorized access?
   - If yes or unknown, treat as possible personal-data breach.
4. Is risk to rights and freedoms unlikely?
   - If clearly unlikely, document rationale and no authority notice.
   - If risk exists or cannot be excluded, prepare supervisory authority notice.
5. Is high risk likely?
   - If yes, prepare affected-user communication without undue delay.

## Risk Criteria

Consider:

- data sensitivity;
- affected user count;
- public exposure or search-engine indexing;
- cross-tenant disclosure;
- identity/auth/session compromise;
- payment/billing implications;
- subscriber/contact-form/message content;
- DSAR/export data;
- ability to contain before access;
- evidence of access/download/exfiltration;
- vulnerability duration;
- affected people in vulnerable contexts;
- likelihood of phishing, impersonation, financial loss, discrimination, or
  reputation harm.

## Supervisory Authority Notification

Authority notice should include, where known:

- nature of the breach;
- categories and approximate number of affected data subjects;
- categories and approximate number of affected records;
- likely consequences;
- measures taken or proposed;
- contact point;
- whether details are incomplete and updates will follow.

If StageLink is unsure which authority applies, escalate to legal review. Public
policy and legal-foundations documents should be updated once StageLink's final
entity, establishment, representative, and DPO posture are confirmed.

## User Notification

Notify affected users when high risk is likely, or when user action is needed
to reduce harm.

Examples that usually require user notice:

- account/session compromise;
- private dashboard, subscriber, contact, billing, or DSAR data exposure;
- cross-tenant private data exposure;
- public exposure of private media/contact data;
- provider token or credential exposure that requires artist action.

User notice should:

- be clear and plain language;
- describe what happened;
- describe affected data categories;
- explain likely impact;
- explain what StageLink did;
- list recommended user actions;
- provide a contact channel;
- avoid speculation and legal overpromising.

## No-Notification Rationale

If StageLink decides not to notify authority or users, record:

- incident id;
- facts known;
- data categories;
- containment evidence;
- why risk is unlikely or high risk is not likely;
- reviewer and timestamp;
- whether counsel reviewed.

## Third-Party Processor Notices

When a provider notifies StageLink:

- record provider awareness/notice time;
- request affected data categories, regions, systems, exposure window, and
  mitigation evidence;
- determine whether StageLink must notify its users/authority;
- do not rely solely on provider reassurance if StageLink logs show broader
  impact.

When StageLink discovers a provider-related breach:

- open provider ticket immediately;
- preserve the ticket ID and response times;
- request written evidence;
- include provider facts in breach assessment.

## Evidence Required Before Closure

- final category/severity;
- breach/no-breach decision;
- authority notice decision;
- user notice decision;
- containment evidence;
- remediation evidence;
- provider tickets if applicable;
- postmortem and follow-up owners for High/Critical incidents.

## Sources Used

- GDPR Regulation (EU) 2016/679, Articles 33 and 34:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EDPB Guidelines 9/2022 on personal data breach notification under GDPR:
  https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-92022-personal-data-breach-notification-under_en
