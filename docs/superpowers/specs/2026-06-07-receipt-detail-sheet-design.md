# Receipt Detail Sheet + Network Status — Design

**Date:** 2026-06-07  
**Status:** Implemented  

## Summary

- Recent Receipts header: `Ready / Online` vs `Ready / Offline`
- Tap any receipt card → 75vh bottom sheet (no center dialog)
- Photo: IndexedDB MVP; `imageUrl` reserved for future Blob signed URL

See implementation in `components/receipts/`, `lib/receipts/receiptDetail.ts`, `lib/tax/irsScheduleLabel.ts`.
