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

function showCopyNotification() {
    console.log('showCopyNotification called'); // This should appear in your browser console when the function is called
    const notification = document.getElementById('copyNotification');
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
            namesToCopy.push(checkbox.nextSibling.textContent);
        }
    });

    const textToCopy = namesToCopy.join("\n");
    if (textToCopy) {
        copyToClipboard(textToCopy);
        showCopyNotification(); // Show notification
    } else {
        showCopyNotification("No names selected!"); // Show error message if nothing selected
    }
}

function copyAll() {
    const labels = document.querySelectorAll("#resultList label");
    let namesToCopy = [];

    labels.forEach(label => namesToCopy.push(label.textContent));

    if (namesToCopy.length > 0) {
        copyToClipboard(namesToCopy.join("\n"));
    } else {
        showCopyNotification("No names to copy!"); // Optionally show a message if there's nothing to copy
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.textContent = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
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
    const rows = data.split('\n');
    let names = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Assuming names are in the first column
        if (cells[0]) {
            names.push(cells[0].trim());
        }
    }

    const textarea = document.getElementById('inputTextarea');
    textarea.value = names.join('\n');
}

function displayNames(names) {
    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    names.forEach((name, index) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "nameCheckbox";
        checkbox.id = "checkbox" + index;

        const label = document.createElement("label");
        label.htmlFor = "checkbox" + index;

        // Remove any email address and dots from the name
        name = name.split('@')[0].replace(/\./g, ' ');

        // Flip last and first names if there's a comma
        if (name.includes(",")) {
            let [lastName, firstName] = name.split(",").map(n => n.trim());
            name = `${firstName} ${lastName}`;
        }

        label.textContent = name.trim();

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

function filterAndDisplayZugesagt(data) {
    const rows = data.split('\n');
    let namesZugesagt = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Check if the response is 'Zugesagt' and add to the list
        if (cells[2] && cells[2].trim() === 'Zugesagt') {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                name = splitName[1] + " " + splitName[0]; // Flipping the name
            }
            namesZugesagt.push(name);
        }
    }

    displayNames(namesZugesagt);
}

function filterAndDisplayVorbehalt(data) {
    const rows = data.split('\n');
    let namesZugesagt = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Check if the response is 'Zugesagt' and add to the list
        if (cells[2] && cells[2].trim() === 'Mit Vorbehalt') {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                name = splitName[1] + " " + splitName[0]; // Flipping the name
            }
            namesZugesagt.push(name);
        }
    }

    displayNames(namesZugesagt);
}

function filterAndDisplayDecline(data) {
    const rows = data.split('\n');
    let namesZugesagt = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Check if the response is 'Abgesagt' and add to the list
        if (cells[2] && cells[2].trim() === 'Abgesagt') {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                name = splitName[1] + " " + splitName[0]; // Flipping the name
            }
            namesZugesagt.push(name);
        }
    }

    displayNames(namesZugesagt);
}

function filterAndDisplayNoResponse(data) {
    const rows = data.split('\n');
    let namesZugesagt = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Check if the response is 'Abgesagt' and add to the list
        if (cells[2] && cells[2].trim() === 'Keine') {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                name = splitName[1] + " " + splitName[0]; // Flipping the name
            }
            namesZugesagt.push(name);
        }
    }

    displayNames(namesZugesagt);
}

function filterAndDisplayAll(data) {
    const rows = data.split('\n');
    let namesZugesagt = [];

    // Starting from index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split('\t');

        // Check if the response is 'Abgesagt' and add to the list
        if (true) {
            let name = cells[0].trim();
            if (name.includes(",")) {
                const splitName = name.split(",").map(n => n.trim());
                name = splitName[1] + " " + splitName[0]; // Flipping the name
            }
            namesZugesagt.push(name);
        }
    }

    displayNames(namesZugesagt);
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
