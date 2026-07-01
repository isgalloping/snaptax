# Snap1099 Data Subject Request (DSR) Playbook

**Owner:** Legal / Engineering  
**Last Updated:** June 2026  
**Contact:** legal@snap1099.com

## Scope

Handles GDPR, CPRA, and similar privacy requests from Snap1099 users and their authorized agents.

## Request types

| Type | In-app self-service | Manual via email |
|------|---------------------|------------------|
| Access / export | Tax Pack export, receipt list | Provide export or account summary |
| Erasure | **Delete Account** (Settings) | Verify identity → run server delete |
| Rectification | Edit receipt in App | Support ticket |
| Restrict / object | — | Case-by-case; may require account pause |
| Do Not Sell (CPRA) | N/A — we do not sell | Acknowledge; no action needed |

## SLA

| Milestone | Target |
|-----------|--------|
| Acknowledgment | **48 hours** |
| Fulfillment | **30 days** (extend +60 days with notice where permitted) |
| Delete Account (cloud) | Typically within **30 days** of verified request |

## Intake workflow

1. **Receive** — email to legal@snap1099.com or in-app Delete Account.
2. **Log** — ticket ID, date received, request type, jurisdiction hint.
3. **Verify identity**
   - Signed-in user: reply from registered Google email, or confirm recent receipt metadata.
   - Ghost-only: device-bound; erasure via Delete Account on device; email requests need proof of Ghost session ownership (e.g., recent export, receipt IDs).
   - Agent: written authorization + principal identity.
4. **Acknowledge** — use [dsr-ack.md](./templates/dsr-ack.md).
5. **Fulfill** — export, delete, or explain in-app path.
6. **Close** — use [dsr-complete.md](./templates/dsr-complete.md); retain minimal audit log (no receipt content).

## Delete Account (technical)

- **Signed in:** `DELETE /api/users/me` + local IndexedDB/OPFS wipe (client flow).
- **Ghost:** local wipe + ghost server data purge per retention policy.
- Confirm Blob/Postgres deletion in ops checklist; rate-limit buckets may retain hashed keys briefly.

## Escalation

- Suspected breach → [security-incident.md](../legal/security-incident.md) + IRP (M4).
- Legal uncertainty → external counsel.

## Related docs

- [Privacy Policy](../legal/privacy.md) §9  
- [Data Retention Policy](../legal/data-retention.md)  
- [PRODUCT-SPEC §2.3](../product/PRODUCT-SPEC.md)
