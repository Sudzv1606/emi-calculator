function calculateEMI() {
    // Reset previous results
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    emiResult.innerText = '';
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');

    // Get input values
    const market = document.getElementById('market').value;
    const loanType = document.getElementById('loan-type').value;
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const tenureYears = parseInt(document.getElementById('tenure').value);
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;
    const extraFrequency = parseInt(document.getElementById('extra-frequency').value) || 0;

    // Check for invalid inputs
    if (isNaN(loanAmount) || isNaN(tenureYears) || loanAmount <= 0 || tenureYears <= 0) {
        emiResult.innerText = "Please enter valid positive numbers for loan amount and tenure.";
        emiResult.classList.add('show');
        return;
    }
    if (extraPayment < 0 || extraFrequency < 0) {
        emiResult.innerText = "Extra payment amount and frequency must be non-negative.";
        emiResult.classList.add('show');
        return;
    }

    // Define interest rates based on market and loan type
    const rates = {
        US: {
            home: 3.5,    // 3.5% for Home Loan
            car: 5.0,     // 5.0% for Car Loan
            personal: 7.0 // 7.0% for Personal Loan
        },
        Canada: {
            home: 3.0,    // 3.0% for Home Loan
            car: 4.5,     // 4.5% for Car Loan
            personal: 6.5 // 6.5% for Personal Loan
        }
    };

    const annualRate = rates[market][loanType];
    const monthlyRate = annualRate / 100 / 12; // Convert annual rate to monthly rate
    const tenureMonths = tenureYears * 12;

    // EMI Formula
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const emi = numerator / denominator || 0; // Default to 0 if calculation fails
    
    // Display the result
    emiResult.innerText = `Your EMI is: $${emi.toFixed(2)}`;
    emiResult.classList.add('show');
    generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment, extraFrequency);
}

// Add event listener to recalculate when selections or inputs change
document.getElementById('emi-form').addEventListener('change', calculateEMI);

function calculateAndScroll() {
    calculateEMI(); // Run the calculation
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' }); // Scroll smoothly to Results
    }
}

let chartInstance = null; // Store the chart instance globally

function generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment, extraFrequency) {
    let balance = loanAmount;
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';
    const balances = [];
    let totalInterest = 0; // Track total interest paid

    for (let i = 0; i < tenureMonths; i++) {
        const interest = balance * monthlyRate;
        totalInterest += interest; // Accumulate monthly interest
        let principal = emi - interest;
        balance -= principal;

        if (extraFrequency > 0 && (i + 1) % extraFrequency === 0) {
            balance -= extraPayment;
        }
        if (balance < 0) balance = 0;
        balances.push(balance.toFixed(2));

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Month">${i + 1}</td>
            <td data-label="Payment">$${emi.toFixed(2)}</td>
            <td data-label="Principal">$${principal.toFixed(2)}</td>
            <td data-label="Interest">$${interest.toFixed(2)}</td>
            <td data-label="Balance">$${balance.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);

        if (balance <= 0) break;
    }

    const table = document.getElementById('amortization-table');
    table.style.display = 'table';
    setTimeout(() => table.classList.add('show'), 10);

    // Calculate total amount paid (EMI * number of payments, adjusted for early payoff)
    const actualMonths = balances.length; // Number of payments, considering early payoff
    const totalPayments = emi * actualMonths;

    // Display totals
    document.getElementById('total-payment').innerText = `$${totalPayments.toFixed(2)}`;
    document.getElementById('total-interest').innerText = `$${totalInterest.toFixed(2)}`;

    // Generate chart with high resolution
    const chartCanvas = document.getElementById('balance-chart');
    const dpr = window.devicePixelRatio || 1; // Get device pixel ratio for high DPI screens
    chartCanvas.width = 800 * dpr; // Increase pixel width for sharpness
    chartCanvas.height = 400 * dpr; // Increase pixel height for sharpness
    chartCanvas.style.width = '100%'; // CSS width
    chartCanvas.style.height = '400px'; // CSS height
    const ctx = chartCanvas.getContext('2d');
    ctx.scale(dpr, dpr); // Scale context for high DPI
    if (window.myChart) window.myChart.destroy(); // Clear previous chart instance
    console.log('Canvas Size - Width:', chartCanvas.width, 'Height:', chartCanvas.height, 'Style Width:', chartCanvas.style.width, 'Style Height:', chartCanvas.style.height, 'Display:', chartCanvas.style.display, 'Opacity:', chartCanvas.style.opacity);
    console.log('Chart Data - Balances:', balances, 'Tenure Months:', tenureMonths);
    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: balances.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Remaining Balance',
                data: balances,
                borderColor: 'blue',
                fill: false,
                tension: 0.1,
                pointRadius: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            animation: {
                duration: 1000,
                loop: false
            },
            scales: {
                x: {
                    title: { display: true, text: 'Month' },
                    type: 'linear',
                    position: 'bottom',
                    max: tenureMonths,
                    ticks: { stepSize: 1 }
                },
                y: {
                    title: { display: true, text: 'Balance ($)' },
                    beginAtZero: true,
                    suggestedMax: loanAmount * 1.1
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            layout: {
                padding: 20
            }
        }
    });
    setTimeout(() => {
        chartCanvas.classList.add('show');
        console.log('Chart Visibility - Display:', chartCanvas.style.display, 'Opacity:', chartCanvas.style.opacity, 'Class:', chartCanvas.className);
    }, 10); // Fade in chart and log visibility
}

// Function to download the amortization schedule as a PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Amortization Schedule", 10, 10);

    const table = document.getElementById('amortization-table');
    const rows = table.querySelectorAll('tr');
    const tableData = [];

    // Add headers
    const headers = ['Month', 'Payment', 'Principal', 'Interest', 'Balance'];
    tableData.push(headers);

    // Add data rows
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length) {
            const rowData = [];
            cells.forEach(cell => rowData.push(cell.textContent));
            tableData.push(rowData);
        }
    });

    doc.autoTable({
        startY: 20,
        head: [tableData[0]], // Headers
        body: tableData.slice(1), // Data rows
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 20 }, // Month
            1: { cellWidth: 40 }, // Payment
            2: { cellWidth: 40 }, // Principal
            3: { cellWidth: 40 }, // Interest
            4: { cellWidth: 40 }  // Balance
        }
    });

    doc.save("amortization_schedule.pdf");
}

// Add event listener for the download button
document.getElementById('download-pdf').addEventListener('click', downloadPDF);