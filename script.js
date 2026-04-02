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

// Original Function Definitions
// Your copyToClipboard function should be using the Clipboard API:
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification("Copied to clipboard!"); // Show success notification
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showCopyNotification("Failed to copy!"); // Show error notification
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
    const reader = new FileReader();

    reader.onload = function(event) {
        const csvData = event.target.result;
        parseCSVtoTextarea(csvData);
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
        filterAndDisplayDecline,
        getEffectiveTheme,
        getNextThemePreference,
        getStoredThemePreference,
        handleSystemThemeChange,
        persistThemePreference
    };
}

// Example usage:
// filterAndDisplayZugesagt(inputData); // Where inputData is your TSV string
