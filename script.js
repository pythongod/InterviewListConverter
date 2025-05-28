// Dark Mode Toggle Logic
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const themeToggleButton = document.getElementById('darkModeToggle');

// Function to update button icon based on theme
function updateThemeButtonIcon() {
    if (!themeToggleDarkIcon || !themeToggleLightIcon) return; // Guard against missing elements

    if (document.documentElement.classList.contains('dark') || localStorage.theme === 'dark') {
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
    }
}

// Apply initial theme (on page load)
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
updateThemeButtonIcon(); // Set initial icon state

// Event listener for the toggle button
if (themeToggleButton) {
    themeToggleButton.addEventListener('click', function() {
        // Toggle theme class on <html>
        document.documentElement.classList.toggle('dark');

        // Update localStorage
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'dark';
        } else {
            localStorage.theme = 'light';
        }

        // Update button icon
        updateThemeButtonIcon();
    });
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
    const labels = document.querySelectorAll("#resultList label");
    let namesToCopy = [];

    labels.forEach(label => namesToCopy.push(label.dataset.name));

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

function parseCSVtoTextarea(data) {
    const textarea = document.getElementById('inputTextarea'); // Get textarea element first
    const rows = data.split('\n');
    let names = [];

    // Check if rows is empty or only contains a header.
    // Filter out empty strings from rows before checking length for more robustness.
    const contentRows = rows.filter(row => row.trim() !== '');
    if (contentRows.length <= 1) {
        alert("CSV file is empty or contains only a header.");
        textarea.value = ""; // Clear the textarea
        return;
    }

    // Starting from index 1 of the original rows array to skip the header row
    for (let i = 1; i < rows.length; i++) {
        // Check if rows[i] is empty, null, or undefined, or just whitespace
        if (!rows[i] || rows[i].trim() === '') {
            continue;
        }
        const cells = rows[i].split('\t');

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

    // Remove duplicates and empty names, then sort by email domain
    names = [...new Set(names.filter(name => name.trim() !== ''))]
        .sort((a, b) => {
            const domainA = a.split('@')[1] || ''; // Handle cases where name might not have @
            const domainB = b.split('@')[1] || ''; // Handle cases where name might not have @
            return domainA.localeCompare(domainB);
        });

    names.forEach((name, index) => {
        const li = document.createElement("li");
        // Apply Tailwind classes for list items (mimicking shadcn/ui card for items)
        li.className = "flex items-center space-x-3 p-3 rounded-md border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        // Apply Tailwind classes for checkboxes (mimicking shadcn/ui checkbox)
        checkbox.className = "nameCheckbox peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground";
        checkbox.id = "checkbox" + index;

        const label = document.createElement("label");
        // Apply Tailwind classes for labels
        label.className = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-grow";
        label.htmlFor = "checkbox" + index;

        // Extract email domain (if present)
        const emailParts = name.split('@');
        let displayName = name;
        let domain = '';

        if (emailParts.length > 1) {
            displayName = emailParts[0];
            domain = '@' + emailParts[1];
        }
        
        // Remove any email address and dots from the name
        displayName = displayName.replace(/\./g, ' ');

        // Flip last and first names if there's a comma
        if (displayName.includes(",")) {
            let [lastName, firstName] = displayName.split(",").map(n => n.trim());
            if (firstName && lastName) { // Ensure both parts exist
                displayName = `${firstName} ${lastName}`;
            } else if (lastName) { // Only lastName exists (e.g. "Doe,")
                displayName = lastName;
            } // if only firstName, it's already correct
        }

        // Store the name without domain in the dataset for copying
        label.dataset.name = capitalize(displayName.trim()); // Capitalize before storing

        // Display name with domain in UI
        label.innerHTML = `${capitalize(displayName.trim())} <span class="text-xs text-muted-foreground">${domain}</span>`; // Styled domain span

        li.appendChild(checkbox);
        li.appendChild(label);
        resultList.appendChild(li);

        // Enhanced click listener for the whole LI to toggle the checkbox,
        // but prevent if the click was directly on the checkbox itself or on a link/button inside label if any.
        li.addEventListener('click', function(event) {
            if (event.target !== checkbox) { // Check if the click target is not the checkbox itself
                checkbox.checked = !checkbox.checked;
                // Manually trigger change event for any other listeners if necessary
                const changeEvent = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(changeEvent);
            }
            // toggleCopyAll is now called by the checkbox's change event
        });

        // Add change event listener to checkbox to handle state of copyAllButton
        checkbox.addEventListener('change', toggleCopyAll);
    });
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
});


// Generic filter function
function filterAndDisplayGeneric(data, columnIndex, expectedValue, matchAll = false) {
    const rows = data.split('\n');
    const filteredNames = []; // Use a generic name

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || rows[i].trim() === '') { // Skip empty or whitespace-only rows
            continue;
        }
        const cells = rows[i].split('\t');

        // Ensure cells[0] (for name) exists. If not, we can't process this row for a name.
        if (!cells[0] || cells[0].trim() === '') { 
            continue;
        }
        
        // If not matching all, ensure the cell for the condition exists.
        if (!matchAll && (typeof cells[columnIndex] === 'undefined')) { 
            continue;
        }

        if (matchAll || (cells[columnIndex] && cells[columnIndex].trim() === expectedValue)) {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                // Ensure both parts exist after split before trying to access them
                if (splitName.length >= 2 && splitName[0] && splitName[1]) {
                    name = splitName[1] + " " + splitName[0]; // Flipping the name
                } 
                // If splitName doesn't have two valid parts, 'name' remains cells[0].trim()
                // No specific "else" needed here as name is already trimmed from cells[0]
            }
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
    filterAndDisplayGeneric(data, 2, 'Abgesagt');
}

function filterAndDisplayNoResponse(data) {
    filterAndDisplayGeneric(data, 2, 'Keine');
}

function filterAndDisplayAll(data) {
    filterAndDisplayGeneric(data, 0, '', true);
}

function convertEmailList() {
    const input = document.getElementById('emailListInput').value.trim();
    if (!input) {
        alert("Email list input is empty.");
        module.exports.displayNames([]); // Clear the list if input is empty
        return;
    }

    const extractedNames = new Set(); // Use Set to avoid duplicates initially
    
    // Split by major separators first (semicolon, newline), then process each part
    const entries = input.split(/[;\n]+/).flatMap(part => {
        // For each part, we need to carefully split by commas, being mindful of quoted sections
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
                if (current.trim()) {
                    entryParts.push(current.trim());
                }
                current = '';
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
    module.exports.displayNames(Array.from(extractedNames));
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
module.exports = { capitalize, convertEmailList, displayNames };

// Example usage:
// filterAndDisplayZugesagt(inputData); // Where inputData is your TSV string
