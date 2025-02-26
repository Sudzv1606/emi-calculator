function calculateEMI() {
    // Reset previous results
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    emiResult.innerText = '';
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');

    // Get input values
    const market = document.getElementById('market').value;
    const loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const annualRate = parseFloat(document.getElementById('interest-rate').value);
    const tenureYears = parseInt(document.getElementById('tenure').value);
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;
    const extraFrequency = parseInt(document.getElementById('extra-frequency').value) || 0;

    // Check for invalid inputs
    if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(tenureYears) || loanAmount <= 0 || annualRate <= 0 || tenureYears <= 0) {
        emiResult.innerText = "Please enter valid positive numbers.";
        emiResult.classList.add('show');
        return;
    }

    const tenureMonths = tenureYears * 12;
    let monthlyRate;
    if (market === "US") {
        monthlyRate = annualRate / 12 / 100; // Convert percentage to decimal
    } else { // Canada
        const semiAnnualRate = annualRate / 2 / 100;
        monthlyRate = Math.pow(1 + semiAnnualRate, 2 / 12) - 1;
    }
    
    // EMI Formula
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const emi = numerator / denominator;
    
    // Display the result
    emiResult.innerText = `Your EMI is: $${emi.toFixed(2)}`;
    emiResult.classList.add('show');
    generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment, extraFrequency);
}

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

    for (let i = 0; i < tenureMonths; i++) {
        const interest = balance * monthlyRate;
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