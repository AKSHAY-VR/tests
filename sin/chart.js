// Load the Excel data and create the stacked bar chart
async function loadExcelData() {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1eH2VMrD_qDk8fFhxbqlI4AwVW9SaIexPvH1cr-NP8EE/export?format=xlsx';
    try {
        const response = await fetch(sheetUrl);
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        processData(jsonData);
    } catch (error) {
        console.error('Error loading or processing data:', error);
    }
}

// Global data arrays
let candidates = [];
let topics = new Set();
let selectedTopics = new Set();

function processData(data) {
    candidates = [];
    topics = new Set();

    data.forEach(row => {
        const candidateName = row.name;
        const topic = row.topic || 'Unknown';
        const actionable = row.Actionable || 0; // 1 for actionable, 0 for non-actionable

        let candidate = candidates.find(c => c.name === candidateName);
        if (!candidate) {
            candidate = {
                name: candidateName,
                topics: {},
                totalActionable: 0,
                totalNonActionable: 0
            };
            candidates.push(candidate);
        }

        if (!candidate.topics[topic]) {
            candidate.topics[topic] = {
                actionable: 0,
                nonActionable: 0
            };
        }

        candidate.topics[topic][actionable === 1 ? 'actionable' : 'nonActionable']++;
        if (actionable === 1) {
            candidate.totalActionable++;
        } else {
            candidate.totalNonActionable++;
        }

        topics.add(topic);
    });

    // Populate filter checkboxes for topics
    createTopicFilter();
    // Generate initial chart
    createStackedBarChart();
}

// Function to create filter checkboxes for topics
// Function to create filter checkboxes for topics
function createTopicFilter() {
    const container = document.getElementById('checkbox-container');
    container.innerHTML = ''; // Clear previous entries

    // Add "All" checkbox
    let allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.id = 'All';
    allCheckbox.value = 'All';
    allCheckbox.onchange = toggleAllTopics;

    let allLabel = document.createElement('label');
    allLabel.setAttribute('for', 'All');
    allLabel.textContent = 'සියල්ල';

    let allDiv = document.createElement('div');
    allDiv.className = 'checkbox';
    allDiv.appendChild(allCheckbox);
    allDiv.appendChild(allLabel);
    container.appendChild(allDiv);

    // Add checkboxes for individual topics
    topics.forEach(topic => {
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = topic;
        checkbox.value = topic;
        checkbox.onchange = updateChartWithFilter;

        let label = document.createElement('label');
        label.setAttribute('for', topic);
        label.textContent = topic;

        let div = document.createElement('div');
        div.className = 'checkbox';
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

// Function to toggle the "All" checkbox functionality
function toggleAllTopics() {
    const isChecked = document.getElementById('All').checked;
    const checkboxes = document.querySelectorAll('#checkbox-container input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });

    updateChartWithFilter(); // Update chart based on the selection
}


// Update the chart based on selected topics
// Update the chart based on selected topics and display selected topics outside
function updateChartWithFilter() {
    const selectedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
    selectedTopics = new Set(selectedCheckboxes.filter(topic => topic !== 'All'));

    // If "All" is selected, show all topics
    if (selectedCheckboxes.includes('All')) {
        selectedTopics = new Set(topics);
    }

    // Update the selected topics display
    const selectedTopicsDiv = document.getElementById('selected-topics');
    selectedTopicsDiv.innerHTML = `තෝරාගත් මාතෘකා: ${[...selectedTopics].join(', ') || 'සමාජ ආරක්ෂාව, යටිතල පහසුකම්, අනෙක්, වෙළඳාම හා අපනයන, කෘෂිකර්මය, ආර්ථික වර්ධනය, පාලනය, නීතිය හා සාමය, අධ්‍යාපනය, සෞඛ්‍ය, සහජීවනය, දූෂණය, කම්කරු, IMF වැඩපිළිවෙළ, බදු'}`;

    // Update the chart with the selected topics
    createStackedBarChart();
}

// Function to create and update the stacked bar chart
function createStackedBarChart() {
    const ctx = document.getElementById('stackedBarChart').getContext('2d');
    const config = {
        type: 'bar',
        data: {
            labels: candidates.map(c => c.name),
            datasets: [
                {
                    label: 'Monitorable Actions',
                    data: candidates.map(c => selectedTopics.size > 0 ? sumFiltered(c, 'actionable') : c.totalActionable),
                    backgroundColor: 'goldenrod',
                    datalabels: {
                        anchor: 'center', // Places the label inside the bar
                        align: 'center',  // Aligns the label to the center of the bar
                        color: 'white',   // Changes label color for better visibility inside the bar
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                {
                    label: 'Non-Monitorable Actions',
                    data: candidates.map(c => selectedTopics.size > 0 ? sumFiltered(c, 'nonActionable') : c.totalNonActionable),
                    backgroundColor: 'mistyrose',
                    datalabels: {
                        anchor: 'center', // Places the label inside the bar
                        align: 'center',  // Aligns the label to the center of the bar
                        color: 'black',   // Changes label color for better visibility inside the bar
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            ]
        },
        options: {
            plugins: {
                datalabels: {
                    display: true,
                    formatter: (value, ctx) => {
                        return ctx.chart.data.datasets[ctx.datasetIndex].label.includes('Action') ? value : '';
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                }
            },
            layout: {
                padding: {
                    top: 20 // Adds padding at the top of the chart to ensure labels fit
                }
            }
        }
    };

    // Register the datalabels plugin globally
    Chart.register(ChartDataLabels);

    if (window.barChart) {
        window.barChart.destroy(); // Clean up the previous chart instance before creating a new one
    }

    window.barChart = new Chart(ctx, config);
}


// Helper function to sum filtered actionable or non-actionable counts
function sumFiltered(candidate, type) {
    return Array.from(selectedTopics).reduce((acc, topic) => {
        let topicData = candidate.topics[topic] || {actionable: 0, nonActionable: 0};
        return acc + topicData[type];
    }, 0);
}

loadExcelData();
