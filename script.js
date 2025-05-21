// Function Definitions

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
    notification.textContent = message; // Set the message
    notification.style.display = 'block';
    notification.style.opacity = '1';
    notification.style.visibility = 'visible';

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.visibility = 'hidden';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500); // Wait for the fade out to finish before hiding
    }, 2000); // 2000 milliseconds = 2 seconds
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
            const domainA = a.split('@')[1] || '';
            const domainB = b.split('@')[1] || '';
            return domainA.localeCompare(domainB);
        });

    names.forEach((name, index) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "nameCheckbox";
        checkbox.id = "checkbox" + index;

        const label = document.createElement("label");
        label.htmlFor = "checkbox" + index;

        // Extract email domain (if present)
        const emailParts = name.split('@');
        const domain = emailParts.length > 1 ? '@' + emailParts[1] : '';

        // Remove any email address and dots from the name
        name = emailParts[0].replace(/\./g, ' ');

        // Flip last and first names if there's a comma
        if (name.includes(",")) {
            let [lastName, firstName] = name.split(",").map(n => n.trim());
            name = `${firstName} ${lastName}`;
        }

        // Store the name without domain in the dataset for copying
        label.dataset.name = name.trim();

        // Display name with domain in UI
        label.innerHTML = `${name.trim()} <span class="domain">${domain}</span>`;

        li.appendChild(checkbox);
        li.appendChild(label);
        resultList.appendChild(li);

        li.addEventListener('click', function(event) {
            if (event.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
                toggleCopyAll();
            }
        });
    });
}

function toggleCopyAll() {
    const checkboxes = document.querySelectorAll(".nameCheckbox");
    const copyAllButton = document.getElementById("copyAllButton");

    let isCheckedFound = false;
    for (let checkbox of checkboxes) {
        if (checkbox.checked) {
            isCheckedFound = true;
            break;
        }
    }

    if (isCheckedFound) {
        copyAllButton.setAttribute("disabled", true);
        copyAllButton.style.backgroundColor = "#bbb";
    } else {
        copyAllButton.removeAttribute("disabled");
        copyAllButton.style.backgroundColor = "#5c94d3";
    }
}

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
    // columnIndex and expectedValue are irrelevant here as matchAll is true
    filterAndDisplayGeneric(data, 0, '', true);
}

function toggleSection(sectionId) {
    var section = document.getElementById(sectionId);
    var iconId = 'icon-' + sectionId;
    var icon = document.getElementById(iconId);
    section.classList.toggle("show");

    if (section.classList.contains("show")) {
        icon.classList.replace("fa-chevron-down", "fa-chevron-up");
    } else {
        icon.classList.replace("fa-chevron-up", "fa-chevron-down");
    }
}

function capitalize(str) {
    // Split the string into words if there's a space or dot followed by a character
    return str.split(/(?<=\.)\s*|\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}


// Example usage:
// filterAndDisplayZugesagt(inputData); // Where inputData is your TSV string


// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Attaching the event listener to 'convertInputBtn' button
    document.getElementById("convertInputBtn").addEventListener("click", convertToList);

    // Attaching the event listener to 'convertTextareaBtn' button
    document.getElementById("convertTextareaBtn").addEventListener("click", convertTextareaToList);

    // Event listener for file upload
    document.getElementById("csvFile").addEventListener("change", handleFile);

    // Add event listeners for each icon
    document.getElementById("icon-outlookInvites").addEventListener("click", function() {
        toggleSection('content-outlook');
    });
    
    document.getElementById("icon-ms-teams-attendance-list").addEventListener("click", function() {
        toggleSection('content-attendance-list');
    });
    document.getElementById("icon-zugesagtFilter").addEventListener("click", function() {
        toggleSection('content-zugesagtFilter');
    });
    document.getElementById("filterZugesagtBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value; // Corrected ID
        filterAndDisplayZugesagt(inputData);
    });
    document.getElementById("filterVorbehaltBtn").addEventListener("click", function() {
        const inputData = document.getElementById("inputZugesagtData").value; // Corrected ID
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
