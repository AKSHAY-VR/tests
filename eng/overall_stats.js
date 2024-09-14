// Global variables to hold candidates and topics
let candidates = [];
let topics = [];

// Function to load Excel data from a Google Sheets URL
function loadExcelFromGoogleSheet(sheetUrl) {
    fetch(sheetUrl) // Fetch the data from the provided Google Sheets URL
        .then(response => response.arrayBuffer()) // Convert the response to an ArrayBuffer
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' }); // Read the Excel file using XLSX
            const sheetName = workbook.SheetNames[0]; // Get the first sheet name
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert the sheet data to JSON

            processExcelData(jsonData); // Process the JSON data
        })
        .catch(error => console.error('Error loading Excel file:', error));
}

// Function to process the Excel data and populate global variables
function processExcelData(data) {
    candidates = [];
    topics = new Set(); // Use a Set to automatically handle unique topics

    data.forEach(row => {
        const candidateName = row.name;
        const image = row.image; // Assuming the image URL is in the "image" field
        const topic = row.topic || 'Unknown'; // Topic for each promise
        const actionable = row.Actionable || 0; // The "Actionable" variable (1 for actionable, 0 for not actionable)

        let candidate = candidates.find(c => c.name === candidateName);
        if (!candidate) {
            candidate = {
                name: candidateName,
                image: image,
                actionableCount: 0, // To track the overall actionable promises
                totalCount: 0, // To track the total number of promises
                topics: {}
            };
            candidates.push(candidate);
        }

        if (!candidate.topics[topic]) {
            candidate.topics[topic] = { actionableCount: 0, totalCount: 0 };
        }

        candidate.totalCount++; // Increment total promise count
        candidate.topics[topic].totalCount++;

        if (actionable == 1) {
            candidate.actionableCount++; // Increment overall actionable count
            candidate.topics[topic].actionableCount++;
        }

        topics.add(topic);
    });

    // Convert topics to an array for easier manipulation
    topics = Array.from(topics);

    // Create the transposed table and populate the UI
    createTransposedTable(topics, candidates);
}

// Function to create a transposed table where topics are rows and candidates are columns
function createTransposedTable(topics, candidates) {
    const table = d3.select("#transposed-table");

    // Create the header row with candidate images and names
    const headerRow = table.append("tr");

    // "Topics" column header
    headerRow.append("th")
        .attr("class", "topics-header")
        .html("Topics<br/><span class='sub-header'>Monitorable Actions/All Actions</span>");

    // Add candidate headers (name, image, and overall actionable ratio)
    candidates.forEach(candidate => {
        const headerCell = headerRow.append("th")
            .attr("class", "candidate-header");
        
        // Add candidate image
        headerCell.append("img")
            .attr("src", candidate.image)
            .attr("alt", candidate.name);

        // Add candidate name
        headerCell.append("div")
            .text(candidate.name);

        // Calculate the overall actionable promise ratio
        const overallActionableRatio = ((candidate.actionableCount / candidate.totalCount) * 100).toFixed(0);
        
        // Display overall ratio in ratio (percentage) format
        const overallText = `${candidate.actionableCount}/${candidate.totalCount} (${overallActionableRatio}%)`;

        // Add prominent overall actionable ratio in a new row
        headerCell.append("div")
            .attr("class", "overall-row")
            .text(overallText);
    });

    // Add rows for each topic and corresponding actionable promise percentages
    topics.forEach(topic => {
        const row = table.append("tr");

        // Add the topic name in the first column as a clickable link to manifesto.html with topic as a query parameter
        row.append("td")
            .attr("class", "topics-column")  // Apply the distinct style for topics column
            .html(`<a href="manifesto.html?topic=${encodeURIComponent(topic)}">${topic}</a>`); // Create clickable link

        // Add the actionable percentages for each candidate under the topic
        candidates.forEach(candidate => {
            const topicData = candidate.topics[topic] || { actionableCount: 0, totalCount: 0 };
            const actionableRatio = (topicData.totalCount > 0) ? 
                ((topicData.actionableCount / topicData.totalCount) * 100).toFixed(0) : '0';

            // Display actionable promise ratio for the topic in ratio (percentage) format
            const topicText = `${topicData.actionableCount}/${topicData.totalCount} (${actionableRatio}%)`;

            // Add the percentage to the row
            row.append("td").text(topicText);
        });
    });
}

// Open and close feedback form with the iframe
document.getElementById("feedback-button").onclick = function() {
    document.getElementById("feedback-form").style.display = "flex";
}

document.querySelector(".close-btn").onclick = function() {
    document.getElementById("feedback-form").style.display = "none";
}

// Open and close download form with animation
document.getElementById("download-button").onclick = function() {
    document.getElementById("download-form").classList.add("show");
}

document.querySelector(".close-download-btn").onclick = function() {
    document.getElementById("download-form").classList.remove("show");
}


// Load the Excel data from the provided Google Sheets URL
loadExcelFromGoogleSheet('https://docs.google.com/spreadsheets/d/1_q6IaRErhJnPM_pTwiI7pGvOTJ4PJJRMTaz4zr-rmio/export?format=xlsx');