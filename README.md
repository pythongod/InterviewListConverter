# 📝  Interview List Converter

[![Run Tests](https://github.com/USERNAME/InterviewListConverter/actions/workflows/test.yml/badge.svg)](https://github.com/USERNAME/InterviewListConverter/actions/workflows/test.yml)
[![Continuous Integration](https://github.com/USERNAME/InterviewListConverter/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/InterviewListConverter/actions/workflows/ci.yml)

https://interviewlist.netlify.app/ 📝 

A web application to parse and format lists of names from Outlook invites, MS Teams attendance lists, and to filter participants from TSV data based on their response status. All processing is done client-side in your browser.

## Input Methods      

### Outlook Invites

*   **Instructions:** Go to the Outlook invite -> Terminplanungs-Assistent / Scheduling Assistant -> Mark all attendees -> Copy (Ctrl+C) -> Paste into the 'Outlook Invites' input field.
*   **Expected Format:** Names separated by semicolons (`;`). Expected format is 'Last name, First name'.

### MS Teams Attendance List

*   **Instructions:** In MS Teams: People -> Participants -> Three Dots (...) -> Download Attendance List. Then either:
    *   **Option A (Text Area):** Open the downloaded CSV file (usually tab-separated), copy the column containing names, and paste it into the 'MS Teams Attendance List' text area. One name per line. Expected format is 'Last name, First name'.
    *   **Option B (CSV Upload):** Click 'Upload CSV' and select the downloaded attendance file. The tool expects names to be in the first column and the file to be tab-separated.

### Nachverfolgung (Tracking/Filtering)

*   **Instructions:** Paste Tab-Separated Values (TSV) data from your tracking sheet (e.g., from Excel) into the 'Nachverfolgung' text area. The tool expects the first column to be the participant's name and the third column to be their response status.
*   **Functionality:** Use the filter buttons ('Filter Zugesagt', 'Filter Mit Vorbehalt', 'Filter Abgelehnt', 'Filter Keine', 'Filter All') to display names based on their response. 'Filter All' displays all names from the pasted TSV data.

### Convert Email List

This feature allows you to paste a list of email recipients, typically copied from an email client's To: or CC: fields. The tool will attempt to extract individual names and format them as 'FirstName LastName'.

You can paste a list of entries separated by commas (`,`), semicolons (`;`), or newlines. The tool can parse formats such as:
*   `FirstName LastName <email@example.com>`
*   `"LastName, FirstName" <email@example.com>`
*   `email@example.com`
*   `FirstName.LastName@example.com`

If a name is explicitly provided with the email, it will be used (and flipped if in 'Last, First' format). If only an email address is provided, the tool will attempt to create a name from the local part of the email (e.g., 'john.doe' from 'john.doe@example.com' becomes 'John Doe').

## Output

The application will display a cleaned, formatted, and (if applicable) filtered list of names. You can then:
*   Copy individual names by checking the box next to their name and clicking "Copy Selected".
*   Copy all names in the displayed list by clicking "Copy All".

## Privacy

Everything happens in your browser. No names or files are ever uploaded to any server.
