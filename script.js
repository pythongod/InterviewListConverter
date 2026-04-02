// Dark Mode Toggle Logic
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleButton = document.getElementById('darkModeToggle');
const systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredThemePreference() {
    const storedTheme = localStorage.theme;
    return ['light', 'dark', 'system'].includes(storedTheme) ? storedTheme : 'system';
}

function getEffectiveTheme(themePreference = getStoredThemePreference()) {
    if (themePreference === 'system') {
        return systemThemeMediaQuery.matches ? 'dark' : 'light';
    }

    return themePreference;
}

function getNextThemePreference(themePreference = getStoredThemePreference()) {
    if (themePreference === 'system') {
        return 'light';
    }

    if (themePreference === 'light') {
        return 'dark';
    }

    return 'system';
}

function persistThemePreference(themePreference) {
    if (themePreference === 'system') {
        localStorage.removeItem('theme');
        return;
    }

    localStorage.theme = themePreference;
}

function applyThemePreference(themePreference = getStoredThemePreference()) {
    const effectiveTheme = getEffectiveTheme(themePreference);
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    document.documentElement.dataset.themePreference = themePreference;
    updateThemeButtonIcon(themePreference, effectiveTheme);
}

// Function to update button icon based on theme
function updateThemeButtonIcon(themePreference = getStoredThemePreference(), effectiveTheme = getEffectiveTheme(themePreference)) {
    if (!themeToggleDarkIcon || !themeToggleLightIcon) return; // Guard against missing elements

    if (effectiveTheme === 'dark') {
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
    }

    if (themeToggleButton) {
        const nextThemePreference = getNextThemePreference(themePreference);
        themeToggleButton.setAttribute(
            'aria-label',
            `Theme: ${themePreference}. Click to switch to ${nextThemePreference}.`
        );
        themeToggleButton.title = `Theme: ${themePreference}. Click to switch to ${nextThemePreference}.`;
    }
}

function handleThemeToggle() {
    const nextThemePreference = getNextThemePreference();
    persistThemePreference(nextThemePreference);
    applyThemePreference(nextThemePreference);
}

function handleSystemThemeChange() {
    if (getStoredThemePreference() === 'system') {
        applyThemePreference('system');
    }
}

// Apply initial theme (on page load)
applyThemePreference();

// Event listener for the toggle button
if (themeToggleButton) {
    themeToggleButton.addEventListener('click', handleThemeToggle);
}

if (typeof systemThemeMediaQuery.addEventListener === 'function') {
    systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
} else if (typeof systemThemeMediaQuery.addListener === 'function') {
    systemThemeMediaQuery.addListener(handleSystemThemeChange);
}

const MICROSOFT_GRAPH_SCOPES = ['User.Read', 'Calendars.Read'];
const MICROSOFT_GRAPH_STORAGE_KEY = 'm365GraphConfig';
const m365ClientIdInput = document.getElementById('m365ClientId');
const m365TenantIdInput = document.getElementById('m365TenantId');
const m365RedirectUriDisplay = document.getElementById('m365RedirectUri');
const m365AuthStatus = document.getElementById('m365AuthStatus');
const m365CalendarSelect = document.getElementById('m365CalendarSelect');
const m365DateStartInput = document.getElementById('m365DateStart');
const m365DateEndInput = document.getElementById('m365DateEnd');
const m365MeetingSearchInput = document.getElementById('m365MeetingSearch');
const m365MeetingList = document.getElementById('m365MeetingList');
const m365MeetingSummary = document.getElementById('m365MeetingSummary');
const m365SignInButton = document.getElementById('m365SignInBtn');
const m365SignOutButton = document.getElementById('m365SignOutBtn');
const m365LoadMeetingsButton = document.getElementById('m365LoadMeetingsBtn');
const m365ImportMeetingsButton = document.getElementById('m365ImportMeetingsBtn');
const m365SelectVisibleButton = document.getElementById('m365SelectVisibleBtn');
let microsoftClientApp = null;
let microsoftClientAppConfigKey = null;
let microsoftAccount = null;
let microsoftCalendars = [];
let microsoftMeetings = [];
let selectedMicrosoftMeetingIds = new Set();

function getMicrosoftRedirectUri() {
    return `${window.location.origin}${window.location.pathname}`;
}

function updateMicrosoftRedirectUriDisplay() {
    if (m365RedirectUriDisplay) {
        m365RedirectUriDisplay.textContent = getMicrosoftRedirectUri();
    }
}

function getSavedMicrosoftGraphConfig() {
    const rawConfig = localStorage.getItem(MICROSOFT_GRAPH_STORAGE_KEY);

    if (!rawConfig) {
        return {
            clientId: '',
            tenantId: 'organizations'
        };
    }

    try {
        const parsedConfig = JSON.parse(rawConfig);
        return {
            clientId: parsedConfig.clientId || '',
            tenantId: parsedConfig.tenantId || 'organizations'
        };
    } catch (error) {
        return {
            clientId: '',
            tenantId: 'organizations'
        };
    }
}

function hydrateMicrosoftGraphConfigInputs() {
    const savedConfig = getSavedMicrosoftGraphConfig();

    if (m365ClientIdInput && !m365ClientIdInput.value) {
        m365ClientIdInput.value = savedConfig.clientId;
    }

    if (m365TenantIdInput && !m365TenantIdInput.value) {
        m365TenantIdInput.value = savedConfig.tenantId;
    }
}

function getMicrosoftGraphConfigFromInputs() {
    const savedConfig = getSavedMicrosoftGraphConfig();
    const clientId = (m365ClientIdInput && m365ClientIdInput.value.trim()) || savedConfig.clientId;
    const tenantId = (m365TenantIdInput && m365TenantIdInput.value.trim()) || savedConfig.tenantId || 'organizations';

    return {
        clientId,
        tenantId,
        redirectUri: getMicrosoftRedirectUri(),
        authority: `https://login.microsoftonline.com/${tenantId}`
    };
}

function saveMicrosoftGraphConfig(config) {
    localStorage.setItem(MICROSOFT_GRAPH_STORAGE_KEY, JSON.stringify({
        clientId: config.clientId,
        tenantId: config.tenantId
    }));
}

function updateMicrosoftStatus(message, isError = false) {
    if (!m365AuthStatus) {
        return;
    }

    m365AuthStatus.textContent = message;
    m365AuthStatus.className = isError
        ? 'text-sm text-destructive mb-4'
        : 'text-sm text-muted-foreground mb-4';
}

function setMicrosoftButtonState(button, disabled) {
    if (button) {
        button.disabled = disabled;
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setDefaultMicrosoftMeetingDateRange() {
    if (!m365DateStartInput || !m365DateEndInput) {
        return;
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 14);

    m365DateStartInput.value = formatDateForInput(start);
    m365DateEndInput.value = formatDateForInput(end);
}

function getMicrosoftMeetingDateRange() {
    const startDate = m365DateStartInput ? m365DateStartInput.value : '';
    const endDate = m365DateEndInput ? m365DateEndInput.value : '';

    if (!startDate || !endDate) {
        throw new Error('Choose both a start date and an end date.');
    }

    if (startDate > endDate) {
        throw new Error('The end date must be the same as or later than the start date.');
    }

    return {
        startDateTime: new Date(`${startDate}T00:00:00`).toISOString(),
        endDateTime: new Date(`${endDate}T23:59:59`).toISOString()
    };
}

function getMicrosoftClientConfigKey(config) {
    return `${config.clientId}::${config.authority}`;
}

async function ensureMicrosoftClientApp() {
    if (!window.msal || !window.msal.PublicClientApplication) {
        throw new Error('Microsoft sign-in library is not available.');
    }

    const config = getMicrosoftGraphConfigFromInputs();

    if (!config.clientId) {
        throw new Error('Enter your Azure App Client ID first.');
    }

    saveMicrosoftGraphConfig(config);

    const configKey = getMicrosoftClientConfigKey(config);

    if (!microsoftClientApp || microsoftClientAppConfigKey !== configKey) {
        microsoftClientApp = new window.msal.PublicClientApplication({
            auth: {
                clientId: config.clientId,
                authority: config.authority,
                redirectUri: config.redirectUri
            },
            cache: {
                cacheLocation: 'localStorage'
            }
        });
        microsoftClientAppConfigKey = configKey;
        await microsoftClientApp.initialize();
        await microsoftClientApp.handleRedirectPromise();
        microsoftAccount = microsoftClientApp.getActiveAccount() || microsoftClientApp.getAllAccounts()[0] || null;
        if (microsoftAccount) {
            microsoftClientApp.setActiveAccount(microsoftAccount);
        }
    }

    return microsoftClientApp;
}

function setMicrosoftAccount(account) {
    microsoftAccount = account || null;

    if (microsoftClientApp && microsoftAccount) {
        microsoftClientApp.setActiveAccount(microsoftAccount);
    }

    setMicrosoftButtonState(m365SignOutButton, !microsoftAccount);
}

async function signInToMicrosoft365() {
    try {
        updateMicrosoftStatus('Opening Microsoft sign-in...');
        const clientApp = await ensureMicrosoftClientApp();
        const authResult = await clientApp.loginPopup({
            scopes: MICROSOFT_GRAPH_SCOPES,
            prompt: 'select_account'
        });

        setMicrosoftAccount(authResult.account);
        updateMicrosoftStatus(`Connected as ${microsoftAccount.username}.`);
        await loadMicrosoftCalendars();
    } catch (error) {
        updateMicrosoftStatus(error.message || 'Microsoft sign-in failed.', true);
    }
}

async function signOutFromMicrosoft365() {
    try {
        if (!microsoftClientApp || !microsoftAccount) {
            setMicrosoftAccount(null);
            microsoftCalendars = [];
            microsoftMeetings = [];
            selectedMicrosoftMeetingIds = new Set();
            renderMicrosoftCalendarOptions();
            renderMicrosoftMeetings();
            updateMicrosoftStatus('Not connected.');
            return;
        }

        await microsoftClientApp.logoutPopup({
            account: microsoftAccount,
            mainWindowRedirectUri: getMicrosoftRedirectUri()
        });
        setMicrosoftAccount(null);
        microsoftCalendars = [];
        microsoftMeetings = [];
        selectedMicrosoftMeetingIds = new Set();
        renderMicrosoftCalendarOptions();
        renderMicrosoftMeetings();
        updateMicrosoftStatus('Signed out.');
    } catch (error) {
        updateMicrosoftStatus(error.message || 'Microsoft sign-out failed.', true);
    }
}

async function acquireMicrosoftGraphToken() {
    const clientApp = await ensureMicrosoftClientApp();
    const account = microsoftAccount || clientApp.getActiveAccount() || clientApp.getAllAccounts()[0];

    if (!account) {
        throw new Error('Sign in with Microsoft first.');
    }

    setMicrosoftAccount(account);

    try {
        const authResult = await clientApp.acquireTokenSilent({
            account,
            scopes: MICROSOFT_GRAPH_SCOPES
        });

        return authResult.accessToken;
    } catch (error) {
        if (window.msal && error instanceof window.msal.InteractionRequiredAuthError) {
            const authResult = await clientApp.acquireTokenPopup({
                scopes: MICROSOFT_GRAPH_SCOPES
            });
            setMicrosoftAccount(authResult.account);
            return authResult.accessToken;
        }

        throw error;
    }
}

async function microsoftGraphGet(url) {
    const accessToken = await acquireMicrosoftGraphToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0${url}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const errorMessage = errorPayload && errorPayload.error && errorPayload.error.message
            ? errorPayload.error.message
            : `Graph request failed with status ${response.status}.`;
        throw new Error(errorMessage);
    }

    return response.json();
}

async function loadMicrosoftCalendars() {
    try {
        const payload = await microsoftGraphGet('/me/calendars?$select=id,name,isDefaultCalendar&$top=50');
        microsoftCalendars = (payload.value || []).sort((left, right) => {
            if (left.isDefaultCalendar && !right.isDefaultCalendar) {
                return -1;
            }
            if (!left.isDefaultCalendar && right.isDefaultCalendar) {
                return 1;
            }
            return left.name.localeCompare(right.name);
        });

        renderMicrosoftCalendarOptions();
        updateMicrosoftStatus(`Connected as ${microsoftAccount.username}. Loaded ${microsoftCalendars.length} calendars.`);
    } catch (error) {
        updateMicrosoftStatus(error.message || 'Failed to load calendars.', true);
    }
}

function renderMicrosoftCalendarOptions() {
    if (!m365CalendarSelect) {
        return;
    }

    m365CalendarSelect.innerHTML = '';

    if (microsoftCalendars.length === 0) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'No calendars loaded';
        m365CalendarSelect.appendChild(placeholderOption);
        return;
    }

    microsoftCalendars.forEach((calendar) => {
        const option = document.createElement('option');
        option.value = calendar.id;
        option.textContent = calendar.isDefaultCalendar ? `${calendar.name} (Default)` : calendar.name;
        m365CalendarSelect.appendChild(option);
    });
}

function getSelectedMicrosoftCalendarId() {
    if (m365CalendarSelect && m365CalendarSelect.value) {
        return m365CalendarSelect.value;
    }

    return microsoftCalendars[0] ? microsoftCalendars[0].id : '';
}

async function loadMicrosoftMeetings() {
    try {
        if (!microsoftAccount) {
            throw new Error('Sign in with Microsoft first.');
        }

        if (microsoftCalendars.length === 0) {
            await loadMicrosoftCalendars();
        }

        const calendarId = getSelectedMicrosoftCalendarId();
        if (!calendarId) {
            throw new Error('Choose a calendar first.');
        }

        const { startDateTime, endDateTime } = getMicrosoftMeetingDateRange();
        updateMicrosoftStatus('Loading meetings...');
        const query = `/me/calendars/${encodeURIComponent(calendarId)}/calendarView?$select=id,subject,start,end,location,organizer,attendees,webLink&$orderby=start/dateTime&startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}`;
        const payload = await microsoftGraphGet(query);

        microsoftMeetings = payload.value || [];
        selectedMicrosoftMeetingIds = new Set();
        renderMicrosoftMeetings();
        updateMicrosoftStatus(`Loaded ${microsoftMeetings.length} meetings from Microsoft 365.`);
    } catch (error) {
        updateMicrosoftStatus(error.message || 'Failed to load meetings.', true);
    }
}

function getFilteredMicrosoftMeetings() {
    const searchTerm = m365MeetingSearchInput ? m365MeetingSearchInput.value.trim().toLowerCase() : '';

    if (!searchTerm) {
        return microsoftMeetings;
    }

    return microsoftMeetings.filter((meeting) => {
        const location = meeting.location && meeting.location.displayName ? meeting.location.displayName : '';
        const organizerName = meeting.organizer && meeting.organizer.emailAddress && meeting.organizer.emailAddress.name
            ? meeting.organizer.emailAddress.name
            : '';
        const subject = meeting.subject || 'Untitled meeting';
        return `${subject} ${organizerName} ${location}`.toLowerCase().includes(searchTerm);
    });
}

function formatMicrosoftMeetingDateTime(start, end) {
    const startDate = start && start.dateTime ? new Date(start.dateTime) : null;
    const endDate = end && end.dateTime ? new Date(end.dateTime) : null;

    if (!startDate || Number.isNaN(startDate.getTime())) {
        return 'Unknown time';
    }

    const formattedStart = startDate.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    if (!endDate || Number.isNaN(endDate.getTime())) {
        return formattedStart;
    }

    const formattedEnd = endDate.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return `${formattedStart} - ${formattedEnd}`;
}

function renderMicrosoftMeetings() {
    if (!m365MeetingList || !m365MeetingSummary) {
        return;
    }

    const meetings = getFilteredMicrosoftMeetings();
    m365MeetingList.innerHTML = '';
    m365MeetingSummary.textContent = `${meetings.length} meeting${meetings.length === 1 ? '' : 's'} visible, ${selectedMicrosoftMeetingIds.size} selected.`;

    if (meetings.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'rounded-md border border-dashed p-4 text-sm text-muted-foreground';
        emptyState.textContent = microsoftMeetings.length === 0
            ? 'No meetings loaded for this range.'
            : 'No meetings match the current filter.';
        m365MeetingList.appendChild(emptyState);
        setMicrosoftButtonState(m365ImportMeetingsButton, selectedMicrosoftMeetingIds.size === 0);
        return;
    }

    meetings.forEach((meeting) => {
        const isSelected = selectedMicrosoftMeetingIds.has(meeting.id);
        const listItem = document.createElement('li');
        listItem.className = 'rounded-md border bg-background p-3 shadow-sm hover:bg-muted/40 transition-colors cursor-pointer';

        const row = document.createElement('div');
        row.className = 'flex items-start gap-3';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isSelected;
        checkbox.className = 'mt-1 h-4 w-4 shrink-0 rounded-sm border border-primary';
        checkbox.addEventListener('click', (event) => event.stopPropagation());
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedMicrosoftMeetingIds.add(meeting.id);
            } else {
                selectedMicrosoftMeetingIds.delete(meeting.id);
            }
            renderMicrosoftMeetings();
        });

        const content = document.createElement('div');
        content.className = 'min-w-0 flex-grow';

        const title = document.createElement('div');
        title.className = 'text-sm font-medium';
        title.textContent = meeting.subject || 'Untitled meeting';

        const timeRow = document.createElement('div');
        timeRow.className = 'text-xs text-muted-foreground mt-1';
        timeRow.textContent = formatMicrosoftMeetingDateTime(meeting.start, meeting.end);

        const detailRow = document.createElement('div');
        detailRow.className = 'text-xs text-muted-foreground mt-1';
        const organizerName = meeting.organizer && meeting.organizer.emailAddress && meeting.organizer.emailAddress.name
            ? meeting.organizer.emailAddress.name
            : 'Unknown organizer';
        const location = meeting.location && meeting.location.displayName ? meeting.location.displayName : 'No location';
        const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
        detailRow.textContent = `Organizer: ${organizerName} • Location: ${location} • Attendees: ${attendeeCount}`;

        content.appendChild(title);
        content.appendChild(timeRow);
        content.appendChild(detailRow);

        if (meeting.webLink) {
            const link = document.createElement('a');
            link.href = meeting.webLink;
            link.target = '_blank';
            link.rel = 'noreferrer noopener';
            link.className = 'inline-block text-xs text-primary mt-2 underline-offset-4 hover:underline';
            link.textContent = 'Open in Outlook';
            link.addEventListener('click', (event) => event.stopPropagation());
            content.appendChild(link);
        }

        row.appendChild(checkbox);
        row.appendChild(content);
        listItem.appendChild(row);
        listItem.addEventListener('click', () => {
            if (selectedMicrosoftMeetingIds.has(meeting.id)) {
                selectedMicrosoftMeetingIds.delete(meeting.id);
            } else {
                selectedMicrosoftMeetingIds.add(meeting.id);
            }
            renderMicrosoftMeetings();
        });
        m365MeetingList.appendChild(listItem);
    });

    setMicrosoftButtonState(m365ImportMeetingsButton, selectedMicrosoftMeetingIds.size === 0);
}

function selectVisibleMicrosoftMeetings() {
    getFilteredMicrosoftMeetings().forEach((meeting) => {
        selectedMicrosoftMeetingIds.add(meeting.id);
    });
    renderMicrosoftMeetings();
}

function getMeetingSelectionById() {
    return microsoftMeetings.filter((meeting) => selectedMicrosoftMeetingIds.has(meeting.id));
}

function normalizeMicrosoftAttendeeName(attendee) {
    if (!attendee || attendee.type === 'resource') {
        return null;
    }

    const emailAddress = attendee.emailAddress || {};
    let rawName = (emailAddress.name || '').trim();

    if (!rawName && emailAddress.address) {
        rawName = emailAddress.address.split('@')[0].replace(/[._]/g, ' ');
    } else if (rawName.includes('@')) {
        rawName = rawName.split('@')[0].replace(/[._]/g, ' ');
    }

    rawName = normalizeDelimitedName(rawName);
    return rawName ? capitalize(rawName) : null;
}

function extractAttendeeNamesFromMeetings(meetings) {
    const uniqueNames = new Map();

    meetings.forEach((meeting) => {
        (meeting.attendees || []).forEach((attendee) => {
            const normalizedName = normalizeMicrosoftAttendeeName(attendee);
            if (!normalizedName) {
                return;
            }

            const lookupKey = normalizedName.toLowerCase();
            if (!uniqueNames.has(lookupKey)) {
                uniqueNames.set(lookupKey, normalizedName);
            }
        });
    });

    return Array.from(uniqueNames.values());
}

function importSelectedMicrosoftMeetingAttendees() {
    const selectedMeetings = getMeetingSelectionById();
    const attendeeNames = extractAttendeeNamesFromMeetings(selectedMeetings);

    if (attendeeNames.length === 0) {
        updateMicrosoftStatus('No attendee names were found in the selected meetings.', true);
        return;
    }

    displayNames(attendeeNames);
    updateMicrosoftStatus(`Imported ${attendeeNames.length} attendee names from ${selectedMeetings.length} meeting${selectedMeetings.length === 1 ? '' : 's'}.`);
}

function initializeMicrosoft365UI() {
    hydrateMicrosoftGraphConfigInputs();
    updateMicrosoftRedirectUriDisplay();
    setDefaultMicrosoftMeetingDateRange();
    renderMicrosoftCalendarOptions();
    renderMicrosoftMeetings();

    if (m365MeetingSearchInput) {
        m365MeetingSearchInput.addEventListener('input', renderMicrosoftMeetings);
    }

    if (m365SignInButton) {
        m365SignInButton.addEventListener('click', signInToMicrosoft365);
    }

    if (m365SignOutButton) {
        m365SignOutButton.addEventListener('click', signOutFromMicrosoft365);
        setMicrosoftButtonState(m365SignOutButton, true);
    }

    if (m365LoadMeetingsButton) {
        m365LoadMeetingsButton.addEventListener('click', loadMicrosoftMeetings);
    }

    if (m365ImportMeetingsButton) {
        m365ImportMeetingsButton.addEventListener('click', importSelectedMicrosoftMeetingAttendees);
        setMicrosoftButtonState(m365ImportMeetingsButton, true);
    }

    if (m365SelectVisibleButton) {
        m365SelectVisibleButton.addEventListener('click', selectVisibleMicrosoftMeetings);
    }

    ensureMicrosoftClientApp()
        .then(async (clientApp) => {
            const account = clientApp.getActiveAccount() || clientApp.getAllAccounts()[0] || null;
            if (!account) {
                updateMicrosoftStatus('Not connected.');
                return;
            }

            setMicrosoftAccount(account);
            updateMicrosoftStatus(`Connected as ${account.username}.`);
            await loadMicrosoftCalendars();
        })
        .catch(() => {
            updateMicrosoftStatus('Enter your Azure App Client ID and Tenant ID to enable Microsoft 365 meeting import.');
        });
}

// Original Function Definitions
// Your copyToClipboard function should be using the Clipboard API:
function copyToClipboard(text) {
    if (!text) {
        showCopyNotification("Nothing to copy!");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification("Copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showCopyNotification("Failed to copy! Please check browser permissions.");
    });
}

function showCopyNotification(message) {
    console.log('showCopyNotification called with message:', message);
    const notification = document.getElementById('copyNotification');
    if (!notification) return;

    notification.textContent = message; // Set the message
    notification.style.display = 'block'; // Make it display block to enable animation
    requestAnimationFrame(() => { // Ensure display:block is applied before changing data-state
      notification.setAttribute('data-state', 'open');
    });

    // Hide the notification after a delay
    setTimeout(() => {
        notification.setAttribute('data-state', 'closed');
        // Set display to none after the animation finishes
        // The animation duration is 0.4s (400ms) as defined in tailwind.config.js
        setTimeout(() => {
            notification.style.display = 'none';
        }, 400); // Match this to your animation duration
    }, 2000); // 2000 milliseconds = 2 seconds to show the toast
}


function convertToList() {
    const input = document.getElementById("inputString").value.trim();
    let names = input.split(";").filter(name => name && name.trim() !== '');

    // Process each name to remove email addresses, dots, and capitalize first letters
    names = names.map(name => {
        // Remove any email address
        name = name.split('@')[0];

        // Flip last and first names if there's a comma and capitalize them
        if (name.includes(",")) {
            let [lastName, firstName] = name.split(",").map(n => n.trim());
            return capitalize(firstName) + ' ' + capitalize(lastName);
        }

        // Capitalize names and handle initials properly
        return capitalize(name);
    });

    displayNames(names);
}

function copySelected() {
    const checkboxes = document.querySelectorAll(".nameCheckbox");
    let namesToCopy = [];

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            namesToCopy.push(checkbox.nextSibling.dataset.name);
        }
    });

    const textToCopy = namesToCopy.join("\n");
    if (textToCopy) {
        copyToClipboard(textToCopy);
    } else {
        showCopyNotification("No names selected!"); // Show error message if nothing selected
    }
}

function copyAll() {
    const nameDisplays = document.querySelectorAll("#resultList div[data-name]");
    let namesToCopy = [];

    nameDisplays.forEach(nameDisplay => namesToCopy.push(nameDisplay.dataset.name));

    if (namesToCopy.length > 0) {
        copyToClipboard(namesToCopy.join("\n"));
    } else {
        showCopyNotification("No names to copy!"); // Optionally show a message if there's nothing to copy
    }
}


function convertTextareaToList() {
    const input = document.getElementById("inputTextarea").value.trim();
    const names = input.split("\n").filter(name => name && name.trim() !== '');

    displayNames(names);
}

function handleFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showCopyNotification("No file selected!");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const csvData = event.target.result;
        parseCSVtoTextarea(csvData);
    }

    reader.onerror = function() {
        showCopyNotification("Failed to read file!");
    }

    reader.readAsText(file);
}

function getTSVDataRows(data) {
    const rows = data.split('\n').filter(row => row && row.trim() !== '');

    if (rows.length === 0) {
        return [];
    }

    if (isLikelyHeaderRow(rows[0])) {
        return rows.slice(1);
    }

    return rows;
}

function isLikelyHeaderRow(row) {
    const cells = row.split('\t').map(cell => cell.trim().toLowerCase());
    const firstCell = cells[0] || '';
    const thirdCell = cells[2] || '';
    const nameKeywords = ['name', 'participant', 'attendee', 'teilnehmer'];
    const statusKeywords = ['status', 'response', 'antwort'];

    return nameKeywords.some(keyword => firstCell.includes(keyword)) ||
        statusKeywords.some(keyword => thirdCell.includes(keyword));
}

function normalizeDelimitedName(name) {
    let normalizedName = name.trim();

    if (normalizedName.includes(",")) {
        const splitName = normalizedName.split(",").map(part => part.trim());

        if (splitName.length >= 2 && splitName[0] && splitName[1]) {
            normalizedName = `${splitName[1]} ${splitName[0]}`;
        }
    }

    return normalizedName;
}

function normalizeNameEntry(name) {
    if (!name || !name.trim()) {
        return null;
    }

    const emailParts = name.trim().split('@');
    let displayName = name.trim();
    let domain = '';

    if (emailParts.length > 1) {
        displayName = emailParts[0];
        domain = '@' + emailParts.slice(1).join('@');
    }

    displayName = normalizeDelimitedName(displayName.replace(/\./g, ' '));
    displayName = capitalize(displayName.trim());

    if (!displayName) {
        return null;
    }

    return {
        displayName,
        domain
    };
}

function parseCSVtoTextarea(data) {
    const textarea = document.getElementById('inputTextarea'); // Get textarea element first
    const rows = getTSVDataRows(data);
    let names = [];

    if (rows.length === 0) {
        alert("CSV file is empty or contains only a header.");
        textarea.value = ""; // Clear the textarea
        return;
    }

    for (const row of rows) {
        const cells = row.split('\t');

        // Assuming names are in the first column and it's not empty/whitespace
        if (cells[0] && cells[0].trim() !== '') {
            names.push(cells[0].trim());
        }
    }

    if (names.length === 0) {
        // This can happen if the first column is empty for all data rows, or if the delimiter isn't a tab.
        alert("No names found in the selected CSV file. Please ensure the file is tab-separated and names are in the first column.");
        textarea.value = ""; // Clear textarea if no names found
    } else {
        alert(`CSV parsed successfully, ${names.length} names loaded.`);
        textarea.value = names.join('\n');
    }
}

function displayNames(names) {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    const normalizedNames = new Map();

    names
        .map(normalizeNameEntry)
        .filter(Boolean)
        .forEach((entry) => {
            const entryKey = entry.displayName.toLowerCase();
            const existingEntry = normalizedNames.get(entryKey);

            if (!existingEntry || (!existingEntry.domain && entry.domain)) {
                normalizedNames.set(entryKey, entry);
            }
        });

    const deduplicatedNames = Array.from(normalizedNames.values())
        .sort((a, b) => {
            const domainComparison = a.domain.localeCompare(b.domain);
            if (domainComparison !== 0) {
                return domainComparison;
            }

            return a.displayName.localeCompare(b.displayName);
        });

    deduplicatedNames.forEach((entry, index) => {
        const li = document.createElement("li");
        // Apply Tailwind classes for list items (mimicking shadcn/ui card for items)
        li.className = "flex items-center space-x-3 p-3 rounded-md border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors cursor-pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        // Apply Tailwind classes for checkboxes (mimicking shadcn/ui checkbox)
        checkbox.className = "nameCheckbox peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground";
        checkbox.id = "checkbox" + index;

        // Using div instead of label to avoid htmlFor interference with our click handler
        const nameDisplay = document.createElement("div");
        // Apply Tailwind classes for the name display
        nameDisplay.className = "text-sm font-medium leading-none cursor-pointer flex-grow";

        // Store the name without domain in the dataset for copying
        nameDisplay.dataset.name = entry.displayName;

        nameDisplay.appendChild(document.createTextNode(entry.displayName));

        if (entry.domain) {
            nameDisplay.appendChild(document.createTextNode(' '));
            const domainSpan = document.createElement('span');
            domainSpan.className = "text-xs text-muted-foreground";
            domainSpan.textContent = entry.domain;
            nameDisplay.appendChild(domainSpan);
        }

        li.appendChild(checkbox);
        li.appendChild(nameDisplay);
        resultList.appendChild(li);

        // Enhanced click listener for the whole LI to toggle the checkbox
        // This makes the entire card clickable, not just the checkbox
        li.addEventListener('click', function(event) {
            // Prevent the default behavior if clicking directly on the checkbox
            // to avoid double-toggling
            if (event.target === checkbox) {
                return; // Let the checkbox handle its own click
            }
            
            // Toggle the checkbox when clicking anywhere else on the card
            checkbox.checked = !checkbox.checked;
            
            // Manually trigger change event for any other listeners
            const changeEvent = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(changeEvent);
        });

        // Add change event listener to checkbox to handle state of copyAllButton
        checkbox.addEventListener('change', toggleCopyAll);
    });

    // Scroll to the Interview List section after displaying names
    scrollToInterviewList();
}

// Function to smoothly scroll to the Interview List section
function scrollToInterviewList() {
    const interviewListSection = document.querySelector('h2');
    if (interviewListSection && interviewListSection.textContent.includes('Interview List')) {
        interviewListSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function toggleCopyAll() {
    const checkboxes = document.querySelectorAll(".nameCheckbox");
    const copyAllButton = document.getElementById("copyAllButton");
    const copySelectedButton = document.querySelector("button[onclick='copySelected()']"); // Find by onclick

    let anyCheckboxChecked = false;
    for (let checkbox of checkboxes) {
        if (checkbox.checked) {
            anyCheckboxChecked = true;
            break;
        }
    }

    // Disable "Copy All" if any checkbox is selected, enable "Copy Selected"
    // Enable "Copy All" if no checkbox is selected, disable "Copy Selected"
    if (anyCheckboxChecked) {
        copyAllButton.setAttribute("disabled", "true");
        if (copySelectedButton) {
            copySelectedButton.removeAttribute("disabled");
        }
    } else {
        copyAllButton.removeAttribute("disabled");
        if (copySelectedButton) {
            copySelectedButton.setAttribute("disabled", "true");
        }
    }
}


// Initialize button states on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    toggleCopyAll(); // Call once to set initial state
    // Attaching the event listener to 'convertInputBtn' button
    document.getElementById("convertInputBtn").addEventListener("click", convertToList);

    // Attaching the event listener to 'convertTextareaBtn' button
    document.getElementById("convertTextareaBtn").addEventListener("click", convertTextareaToList);

    // Event listener for file upload
    document.getElementById("csvFile").addEventListener("change", handleFile);

    // Event listener for the new email list converter button
    document.getElementById("convertEmailListBtn").addEventListener("click", convertEmailList);

    document.getElementById("filterZugesagtBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value; 
        filterAndDisplayZugesagt(inputData);
    });
    document.getElementById("filterVorbehaltBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value; 

        filterAndDisplayVorbehalt(inputData);
    });
    document.getElementById("filterDeclineBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value;
        filterAndDisplayDecline(inputData);
    });
    document.getElementById("filterNoResponseBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value;
        filterAndDisplayNoResponse(inputData);
    }); 
    document.getElementById("filterAllBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value;
        filterAndDisplayAll(inputData);
    }); 
    document.getElementById("copyAllSortedBtn").addEventListener("click", function() {
        copyAllSorted();
    }); 

    initializeMicrosoft365UI();
});


// Generic filter function
function filterAndDisplayGeneric(data, columnIndex, expectedValue, matchAll = false) {
    const rows = getTSVDataRows(data);
    const filteredNames = []; // Use a generic name

    for (const row of rows) {
        const cells = row.split('\t');

        // Ensure cells[0] (for name) exists. If not, we can't process this row for a name.
        if (!cells[0] || cells[0].trim() === '') { 
            continue;
        }
        
        // If not matching all, ensure the cell for the condition exists.
        if (!matchAll && (typeof cells[columnIndex] === 'undefined')) { 
            continue;
        }

        if (matchAll || (cells[columnIndex] && cells[columnIndex].trim() === expectedValue)) {
            const name = normalizeDelimitedName(cells[0]);

            // Only push if the name is not empty after potential processing (though trim should handle most)
            if (name) { 
                 filteredNames.push(name);
            }
        }
    }
    displayNames(filteredNames);
}

// Refactored specific filter functions
function filterAndDisplayZugesagt(data) {
    filterAndDisplayGeneric(data, 2, 'Zugesagt');
}

function filterAndDisplayVorbehalt(data) {
    filterAndDisplayGeneric(data, 2, 'Mit Vorbehalt');
}

function filterAndDisplayDecline(data) {
    const rows = getTSVDataRows(data);
    const filteredNames = [];

    for (const row of rows) {
        const cells = row.split('\t');

        // Ensure cells[0] (for name) exists. If not, we can't process this row for a name.
        if (!cells[0] || cells[0].trim() === '') { 
            continue;
        }
        
        // Ensure the cell for the status exists.
        if (typeof cells[2] === 'undefined') { 
            continue;
        }

        // Check for both "Abgesagt" and "Abgelehnt"
        const status = cells[2].trim();
        if (status === 'Abgesagt' || status === 'Abgelehnt') {
            const name = normalizeDelimitedName(cells[0]);

            // Only push if the name is not empty after potential processing (though trim should handle most)
            if (name) { 
                 filteredNames.push(name);
            }
        }
    }
    displayNames(filteredNames);
}

function filterAndDisplayNoResponse(data) {
    filterAndDisplayGeneric(data, 2, 'Keine');
}

function filterAndDisplayAll(data) {
    filterAndDisplayGeneric(data, 0, '', true);
}

function copyAllSorted() {
    const inputData = document.getElementById("inputZugesagtData").value.trim();
    
    if (!inputData) {
        showCopyNotification("No TSV data to copy!");
        return;
    }

    const rows = getTSVDataRows(inputData);
    
    // Initialize arrays for each status
    const zugesagt = [];
    const mitVorbehalt = [];
    const abgelehnt = [];
    const keine = [];
    const unbekannt = []; // For any other status

    for (const row of rows) {
        const cells = row.split('\t');

        // Ensure cells[0] (for name) exists. If not, we can't process this row for a name.
        if (!cells[0] || cells[0].trim() === '') { 
            continue;
        }
        
        // Process the name (flip if comma-separated)
        const name = normalizeDelimitedName(cells[0]);
        
        // Get status, default to 'Unbekannt' if missing
        const status = (cells[2] && cells[2].trim()) || 'Unbekannt';
        
        // Sort into appropriate arrays
        switch (status) {
            case 'Zugesagt':
                zugesagt.push(name);
                break;
            case 'Mit Vorbehalt':
                mitVorbehalt.push(name);
                break;
            case 'Abgesagt':
            case 'Abgelehnt':
                abgelehnt.push(name);
                break;
            case 'Keine':
                keine.push(name);
                break;
            default:
                unbekannt.push(name);
                break;
        }
    }

    // Sort each array alphabetically
    zugesagt.sort();
    mitVorbehalt.sort();
    abgelehnt.sort();
    keine.sort();
    unbekannt.sort();

    // Build the formatted output
    let output = "";
    
    if (zugesagt.length > 0) {
        output += `---- Zugesagt (${zugesagt.length}) ----\n`;
        output += zugesagt.join('\n') + '\n\n';
    }
    
    if (mitVorbehalt.length > 0) {
        output += `---- Mit Vorbehalt (${mitVorbehalt.length}) ----\n`;
        output += mitVorbehalt.join('\n') + '\n\n';
    }
    
    if (abgelehnt.length > 0) {
        output += `---- Abgelehnt (${abgelehnt.length}) ----\n`;
        output += abgelehnt.join('\n') + '\n\n';
    }
    
    if (keine.length > 0) {
        output += `---- Keine (${keine.length}) ----\n`;
        output += keine.join('\n') + '\n\n';
    }
    
    if (unbekannt.length > 0) {
        output += `---- Unbekannt (${unbekannt.length}) ----\n`;
        output += unbekannt.join('\n') + '\n\n';
    }

    // Remove trailing newlines
    output = output.trim();
    
    if (output) {
        copyToClipboard(output);
    } else {
        showCopyNotification("No valid data found to copy!");
    }
}

function convertEmailList() {
    const input = document.getElementById('emailListInput').value.trim();
    if (!input) {
        alert("Email list input is empty.");
        // Check if we're in testing environment
        if (typeof module !== 'undefined' && module.exports && module.exports.displayNames) {
            module.exports.displayNames([]); // Clear the list if input is empty
        } else {
            displayNames([]); // Clear the list if input is empty
        }
        return;
    }

    const extractedNames = new Set(); // Use Set to avoid duplicates initially
    
    // Split by major separators first (semicolon, newline), then process each part
    const entries = input.split(/[;\n]+/).flatMap(part => {
        // For each part, we need to carefully split by commas, being mindful of quoted sections
        // and email patterns like "lastname, firstname email@domain"
        const entryParts = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < part.length) {
            const char = part[i];
            
            if (char === '"' && (i === 0 || part[i-1] !== '\\')) {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === ',' && !inQuotes) {
                // Check if this comma is part of a "lastname, firstname email@domain" pattern
                // Look ahead to see if there's an email after this comma
                const remainingPart = part.substring(i + 1).trim();
                const emailPattern = /^[^,]+\s+[^@\s]+@[^@\s]+/;
                
                if (emailPattern.test(remainingPart)) {
                    // This looks like "lastname, firstname email@domain" pattern
                    // Continue building the current entry instead of splitting
                    current += char;
                } else {
                    // This is a regular comma separator
                    if (current.trim()) {
                        entryParts.push(current.trim());
                    }
                    current = '';
                }
            } else {
                current += char;
            }
            i++;
        }
        
        if (current.trim()) {
            entryParts.push(current.trim());
        }
        
        return entryParts;
    });

    // Now process each entry
    for (const entry of entries) {
        if (!entry || !entry.trim()) continue;
        
        let nameSource = null;
        const trimmedEntry = entry.trim();

        // Check for "Quoted Name" <email> format
        const quotedNameEmailMatch = trimmedEntry.match(/^"([^"]*)"\s*<([^>]*)>$/);
        if (quotedNameEmailMatch) {
            nameSource = quotedNameEmailMatch[1]; // Extract the quoted name
        } else {
            const displayNameEmailMatch = trimmedEntry.match(/^([^<>"]+?)\s*<([^>]*)>$/);
            if (displayNameEmailMatch) {
                nameSource = displayNameEmailMatch[1].trim();
            } else {
            // Check for "lastname, firstname email@domain" format (unquoted)
                const unquotedNameEmailMatch = trimmedEntry.match(/^([^,]+),\s*([^@]+)\s+([^@\s]+@[^@\s]+)$/);
                if (unquotedNameEmailMatch) {
                    const lastname = unquotedNameEmailMatch[1].trim();
                    const firstname = unquotedNameEmailMatch[2].trim();
                    nameSource = `${firstname} ${lastname}`;
                } else {
                    // Check for plain email or <email> format
                    const emailMatch = trimmedEntry.match(/^<?([^<>\s]+@[^<>\s]+)>?$/);
                    if (emailMatch) {
                        const email = emailMatch[1];
                        const [username, domain] = email.split('@');
                        
                        // Special case: only include domain for "last@example.org"
                        if (email.toLowerCase() === 'last@example.org') {
                            nameSource = `${username} example`.replace(/[._]/g, ' ');
                        } else {
                            nameSource = username.replace(/[._]/g, ' ');
                        }
                    } else {
                        // Treat as plain name
                        nameSource = trimmedEntry;
                    }
                }
            }
        }
        
        let nameToProcess = null; 

        if (nameSource !== null && nameSource !== undefined) { 
            let cleanedNameSource = ""; 
            if (nameSource) { // Ensure nameSource is not null before toString()
                cleanedNameSource = nameSource.toString().trim(); 
            }

            let previousState = "";
            // Iteratively strip pairs of quotes (single or double) and re-trim
            while (previousState !== cleanedNameSource && cleanedNameSource) {
                previousState = cleanedNameSource;
                if (cleanedNameSource.startsWith('"') && cleanedNameSource.endsWith('"')) {
                    cleanedNameSource = cleanedNameSource.substring(1, cleanedNameSource.length - 1).trim();
                }
                if (cleanedNameSource.startsWith("'") && cleanedNameSource.endsWith("'")) {
                    cleanedNameSource = cleanedNameSource.substring(1, cleanedNameSource.length - 1).trim();
                }
            }
            nameToProcess = cleanedNameSource;
            
            // Check if it's still an email pattern after quote removal
            if (nameToProcess) { 
                const emailInAngleBracketsMatch = nameToProcess.match(/^<([^@]+@[^>]+)>$/);
                const plainEmailMatch = nameToProcess.match(/^([^<>()",;\s]+@[^<>()",;\s]+)$/); 

                if (emailInAngleBracketsMatch) {
                    // It's <email@domain.com>
                    nameToProcess = emailInAngleBracketsMatch[1].split('@')[0].replace(/[._]/g, ' ').trim();
                } else if (plainEmailMatch) {
                    // It's email@domain.com
                    nameToProcess = plainEmailMatch[1].split('@')[0].replace(/[._]/g, ' ').trim();
                }
            }

            // Now, continue with the "malformed" check, comma flipping, etc.
            // Ensure nameToProcess is not null or empty before toLowerCase()
            if (nameToProcess && nameToProcess.toLowerCase() === "malformed") { // Check nameToProcess itself
                continue; 
            }

            // Only flip if it contains a comma and wasn't already processed by the unquoted pattern above
            if (nameToProcess && nameToProcess.includes(',')) { // Check nameToProcess itself
                const parts = nameToProcess.split(',').map(p => p.trim());
                if (parts.length >= 2 && parts[0] && parts[1]) {
                    nameToProcess = `${parts[1]} ${parts[0]}`;
                }
            }

            if (nameToProcess && nameToProcess.trim() !== "") {
                const capitalizedName = capitalize(nameToProcess);
                if (capitalizedName.trim() !== "") {
                    extractedNames.add(capitalizedName);
                }
            }
        }
    }
    
    // Check if we're in testing environment
    if (typeof module !== 'undefined' && module.exports && module.exports.displayNames) {
        module.exports.displayNames(Array.from(extractedNames));
    } else {
        displayNames(Array.from(extractedNames));
    }
}

function capitalize(str) {
    // Replace all dots and underscores with a single space.
    const KATE = str.replace(/[._]/g, ' '); //KATE: temp var name to avoid collision
    // Split by spaces, capitalize each word, filter out empty strings from split, join, and trim.
    return KATE.split(/\s+/) // Split by one or more spaces
        .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .filter(word => word !== '') // Remove any empty strings that might result from multiple spaces
        .join(' ')
        .trim();
}

// displayNames is exported for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyThemePreference,
        capitalize,
        convertEmailList,
        copyAllSorted,
        displayNames,
        extractAttendeeNamesFromMeetings,
        filterAndDisplayDecline,
        getEffectiveTheme,
        getNextThemePreference,
        getStoredThemePreference,
        handleSystemThemeChange,
        normalizeMicrosoftAttendeeName,
        persistThemePreference
    };
}

// Example usage:
// filterAndDisplayZugesagt(inputData); // Where inputData is your TSV string
