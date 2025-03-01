// Function to calculate EMI and update the results
function calculateEMI() {
    // Reset previous results
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    const downloadBtn = document.getElementById('download-pdf');
    emiResult.innerText = '';
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');
    if (downloadBtn) downloadBtn.style.display = 'none'; // Hide download button initially

    // Get input values
    const market = document.getElementById('market').value;
    const loanType = document.getElementById('loan-type').value;
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const annualRate = parseFloat(document.getElementById('interest-rate').value); // Use the input value
    const tenureYears = parseInt(document.getElementById('tenure').value);
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;
    const extraFrequency = parseInt(document.getElementById('extra-frequency').value) || 0;

    // Check for invalid inputs
    if (isNaN(loanAmount) || isNaN(tenureYears) || loanAmount <= 0 || tenureYears <= 0) {
        emiResult.innerText = "Please enter valid positive numbers for loan amount and tenure.";
        emiResult.classList.add('show');
        return;
    }
    if (isNaN(annualRate) || annualRate <= 0) {
        emiResult.innerText = "Please enter a valid positive interest rate.";
        emiResult.classList.add('show');
        return;
    }
    if (extraPayment < 0 || extraFrequency < 0) {
        emiResult.innerText = "Extra payment amount and frequency must be non-negative.";
        emiResult.classList.add('show');
        return;
    }

    const monthlyRate = annualRate / 100 / 12; // Convert annual rate to monthly rate
    const tenureMonths = tenureYears * 12;

    // EMI Formula
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const emi = numerator / denominator || 0; // Default to 0 if calculation fails
    
    // Display the result
    emiResult.innerText = `Your EMI is: $${emi.toFixed(2)}`;
    emiResult.classList.add('show');
    // Update the emi-value span for consistency (optional, since we're setting the whole text)
    const emiValueSpan = document.getElementById('emi-value');
    if (emiValueSpan) emiValueSpan.innerText = emi.toFixed(2);
    generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment, extraFrequency, market, loanType, annualRate);
}

// Function to calculate EMI and scroll to results
function calculateAndScroll() {
    calculateEMI(); // Run the calculation
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' }); // Scroll smoothly to Results
    }
}

// Function to reset the form, sliders, and results
function resetForm() {
    // Reset the form inputs to their initial values
    const form = document.getElementById('emi-form');
    form.reset();

    // Reset sliders to their initial values
    const sliders = [
        { id: 'loan-amount-slider', inputId: 'loan-amount', defaultValue: 10000 },
        { id: 'interest-rate-slider', inputId: 'interest-rate', defaultValue: 5 },
        { id: 'tenure-slider', inputId: 'tenure', defaultValue: 5 }
    ];

    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const numberInput = document.getElementById(slider.inputId);
        sliderElement.value = slider.defaultValue;
        numberInput.value = slider.defaultValue;
    });

    // Reset results, table, and chart
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    const downloadBtn = document.getElementById('download-pdf');

    emiResult.innerText = '';
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');
    if (downloadBtn) downloadBtn.style.display = 'none';

    // Clear totals
    document.getElementById('total-payment').innerText = '';
    document.getElementById('total-interest').innerText = '';

    // Clear the chart
    if (window.myChart) {
        window.myChart.destroy();
        window.myChart = null;
    }

    // Clear the amortization table
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';

    // Optionally, trigger calculateEMI() to show default results
    // calculateEMI();
}

// Function to initialize sliders and sync with number inputs
function initializeSliders() {
    // Get all sliders
    const sliders = document.querySelectorAll('.slider');
    
    sliders.forEach(slider => {
        // Get the corresponding number input using the data-input attribute
        const inputId = slider.getAttribute('data-input');
        const numberInput = document.getElementById(inputId);

        // Set initial value of number input to match slider
        numberInput.value = slider.value;

        // Sync slider to number input
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
            calculateEMI(); // Trigger EMI calculation
        });

        // Sync number input to slider
        numberInput.addEventListener('input', () => {
            let value = parseFloat(numberInput.value);
            // Ensure the value stays within slider bounds
            if (value < slider.min) value = slider.min;
            if (value > slider.max) value = slider.max;
            if (isNaN(value)) value = slider.min; // Fallback if input is invalid
            slider.value = value;
            calculateEMI(); // Trigger EMI calculation
        });
    });
}

// Add event listener to recalculate when selections change
document.getElementById('emi-form').addEventListener('change', calculateEMI);

// Initialize sliders on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSliders();
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.style.display = 'none'; // Hide download button initially
    }
});

let chartInstance = null; // Store the chart instance globally

function generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment, extraFrequency, market, loanType, annualRate) {
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

    // Show the download button after the table is generated
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.style.display = 'block'; // Show the button
    }
}

// Function to download the amortization schedule as a PDF with additional details
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add loan details at the top
    doc.text("Amortization Schedule", 10, 10);
    const loanDetails = [
        `Country: ${document.getElementById('market').value === 'US' ? 'United States' : 'Canada'}`,
        `Loan Type: ${document.getElementById('loan-type').value === 'home' ? 'Home Loan' : document.getElementById('loan-type').value === 'car' ? 'Car Loan' : 'Personal Loan'}`,
        `Loan Amount: $${parseFloat(document.getElementById('loan-amount').value).toFixed(2)}`,
        `Interest Rate: ${document.getElementById('interest-rate').value}%`,
        `EMI: $${parseFloat(document.getElementById('emi-result').textContent.replace('Your EMI is: $', '')).toFixed(2)}`,
        `Total Amount Paid: $${document.getElementById('total-payment').textContent.replace('$', '')}`,
        `Total Interest Paid: $${document.getElementById('total-interest').textContent.replace('$', '')}`
    ];
    let startY = 20;
    loanDetails.forEach((detail, index) => {
        doc.text(detail, 10, startY + (index * 10));
    });
    startY += (loanDetails.length * 10) + 10; // Adjust starting Y for the table

    // Extract amortization table data
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

    // Generate table in PDF
    doc.autoTable({
        startY: startY,
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