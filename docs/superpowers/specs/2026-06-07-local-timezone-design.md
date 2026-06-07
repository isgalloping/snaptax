# Local Timezone Display — Design

**Date:** 2026-06-07  
**Status:** Implemented  

## Summary

- Store UTC; display in browser local timezone (UI) or `X-Time-Zone` IANA header (Excel export).
- **US (`dataRegion: us`):** `en-US` — `MM/DD/YYYY`, 12-hour (`2:30 PM`), short dates `Jun 7`.
- **EU (`dataRegion: eu`):** `en-GB` — `DD/MM/YYYY`, 24-hour (`14:30`), short dates `7 Jun`.
- List: `Today, 2:30 PM` / `Yesterday, 2:30 PM`; older dates include year when not current year.
