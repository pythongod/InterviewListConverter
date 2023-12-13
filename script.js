// Function Definitions

function convertToList() {
    const input = document.getElementById("inputString").value.trim();
    const names = input.split(";").filter(name => name && name.trim() !== '');
    displayNames(names);
}

function copySelected() {
    const checkboxes = document.querySelectorAll(".nameCheckbox");
    let namesToCopy = [];

    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            namesToCopy.push(checkbox.nextSibling.textContent);
        }
    });

    copyToClipboard(namesToCopy.join("\n"));
}

function copyAll() {
    const labels = document.querySelectorAll("#resultList label");
    let namesToCopy = [];

    labels.forEach(label => namesToCopy.push(label.textContent));

    copyToClipboard(namesToCopy.join("\n"));
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

        checkbox.addEventListener('change', toggleCopyAll);

        const label = document.createElement("label");
        label.htmlFor = "checkbox" + index;

        if (name.includes(",")) {
            const splitName = name.split(",").map(n => n.trim());
            label.textContent = splitName[1] + " " + splitName[0];
        } else {
            label.textContent = name.trim();
        }

        li.appendChild(checkbox);
        li.appendChild(label);
        resultList.appendChild(li);

        li.addEventListener('click', function(event) {
            if (event.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            toggleCopyAll();
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

    document.getElementById("filterZugesagtBtn").addEventListener("click", function() {
    const inputData = document.getElementById("convertTextareaToList").value;
    filterAndDisplayZugesagt(inputData);
});
});
