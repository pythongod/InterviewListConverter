# Outlook Add-in Approach

This repo now supports the recommended standalone web approach:

* Microsoft Graph for calendars and meetings
* MSAL Browser for sign-in
* Custom meeting picker in the page

If you want the tool to live inside Outlook itself, the alternative is an Outlook add-in.

## When an Add-in Makes Sense

Use an Outlook add-in when you want:

* the UI embedded directly in Outlook
* actions tied to the currently open meeting or appointment
* a workflow that starts from a specific Outlook item instead of a general calendar browser

## Tradeoffs vs the Graph SPA

### Benefits

* native Outlook surface
* easier “act on this meeting” workflow
* good fit for organizer-side meeting tools

### Drawbacks

* more packaging and deployment overhead
* Outlook-specific manifest/runtime work
* weaker fit for broad calendar browsing and multi-meeting selection
* more client differences across Outlook desktop, web, and Mac

## Likely Add-in Shape

For this project, an add-in implementation would probably:

1. Open in the task pane for an appointment or meeting.
2. Read the current item via Office.js.
3. Extract attendee names and email addresses from the current Outlook item.
4. Feed those attendees into the same normalization and copy flows this app already uses.

That approach is best for “use the meeting I’m already looking at.”

It is not the best fit for:

* browse all meetings in a date range
* search across calendars
* choose several meetings and import all attendees at once

Those use cases are why the standalone Microsoft Graph path was implemented first.

## Microsoft Docs

* Outlook add-ins overview: https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/outlook-add-ins-overview
* Outlook JavaScript API `Office.context.mailbox.item`: https://learn.microsoft.com/en-us/javascript/api/outlook/office.item?view=outlook-js-preview
* Appointment organizer/attendee data: https://learn.microsoft.com/en-us/javascript/api/outlook/office.appointmentread?view=outlook-js-preview

## Recommendation

Keep the standalone Graph-based picker as the primary workflow.

Add an Outlook add-in only if you specifically want:

* in-Outlook task pane UX
* one-click import from the currently open meeting
* organization-managed Outlook deployment
