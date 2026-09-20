# Site analytics

Both entry points use `src/analytics.ts` with GA4 property tag `G-Y6T74H4PC5`.
Only HTTPS apex/www production URLs can load Google. Localhost, Vercel preview
hosts, and other paths never load the tag, even with a saved preference.

Collection is off until the visitor chooses Allow analytics in the footer.
The preference is shared between the homepage and planner on the same origin.
Do Not Track and Global Privacy Control override opt-in. Turning analytics off
reloads the page to stop Google's existing listeners; it does not erase records
already received by Google. Google cookies may remain until their expiry.

Custom events contain a fixed name and measurement ID only:

- `contact_click`: email link selected, not a confirmed inquiry.
- `resume_download`: resume link selected, not proof of download completion.
- `linkedin_click`: LinkedIn profile link selected.
- `planner_open`: homepage planner link selected.
- `planner_started`: first settings edit or scenario selection per page load.
- `scenario_selected`: preset selected, without its name or values.
- `plan_print`: print dialog requested, not proof of completed printing.

Autosaves are not counted as conversions. No financial settings, benefit rating,
school selection, dates, form values, scenario names, or saved plans are passed
to the analytics API. Page URLs omit all query parameters and fragments; referral
URLs retain only the origin. This intentionally omits UTM campaign attribution.
Google still receives ordinary analytics metadata for consenting visitors.

On September 20, 2026, automatic form interactions and site-search capture were
disabled in the existing Main Site stream (10448853992). The stream reported
zero connected site tags. Keep those automatic collection options disabled;
remote settings are not controlled by this code. If useful, mark
`contact_click` and `planner_started` as key events
in GA4; do not label an email click as a completed lead.

Test collection using intercepted Google requests, not real test hits. After
release, verify a consenting real production visit in Realtime. Standard reports
may appear later; no historical planner traffic is backfilled.
