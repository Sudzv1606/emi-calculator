// Function to calculate EMI and update the results
function calculateEMI() {
    console.log("calculateEMI triggered"); // Debugging log to confirm function is called
    // Reset previous results
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    const downloadBtn = document.getElementById('download-pdf');
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');
    if (downloadBtn) downloadBtn.style.display = 'none'; // Hide download button initially

    // Get input values
    const currency = document.getElementById('currency').value;
    const loanType = document.getElementById('loan-type').value;
    let loanAmount = parseFloat(document.getElementById('loan-amount').value);
    const annualRate = parseFloat(document.getElementById('interest-rate').value);
    const tenureYears = parseInt(document.getElementById('tenure').value);
    const prepayment = parseFloat(document.getElementById('prepayment').value) || 0;
    const fees = parseFloat(document.getElementById('fees').value) || 0;
    const taxes = parseFloat(document.getElementById('taxes').value) || 0;

    // Adjust loan amount with fees and taxes
    loanAmount += fees + taxes;

    // Check for invalid inputs
    if (isNaN(loanAmount) || isNaN(tenureYears) || loanAmount <= 0 || tenureYears <= 0) {
        emiResult.innerHTML = "<p>Please enter valid positive numbers for loan amount and tenure.</p>";
        emiResult.classList.add('show');
        return;
    }
    if (isNaN(annualRate) || annualRate <= 0) {
        emiResult.innerHTML = "<p>Please enter a valid positive interest rate.</p>";
        emiResult.classList.add('show');
        return;
    }
    if (prepayment < 0 || fees < 0 || taxes < 0) {
        emiResult.innerHTML = "<p>Prepayment amount, fees, and taxes must be non-negative.</p>";
        emiResult.classList.add('show');
        return;
    }

    const monthlyRate = annualRate / 100 / 12; // Convert annual rate to monthly
    const tenureMonths = tenureYears * 12;

    // EMI Formula (without prepayment)
    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const baseEmi = numerator / denominator || 0;

    // Calculate EMI with prepayment effect
    const { emi, actualMonths, totalInterest, totalPayments } = calculateWithPrepayment(loanAmount, monthlyRate, tenureMonths, baseEmi, prepayment);

    // Display the result with currency symbol
    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

    // Ensure the DOM structure exists before updating
    if (!document.getElementById('emi-value') || !document.getElementById('total-interest') || !document.getElementById('total-payment')) {
        emiResult.innerHTML = `
            <p><span class="icon">💳</span> Your EMI is: <span id="emi-value"></span></p>
            <div id="payment-summary">
                <p><span class="icon">🎯</span> Total Interest Paid: <span id="total-interest"></span></p>
                <p>Total Amount Paid: <span id="total-payment"></span></p>
                <p id="months-saved" style="display: none;">Months Saved: <span id="months-saved-value"></span></p>
                <p id="interest-saved" style="display: none;">Interest Saved: <span id="interest-saved-value"></span></p>
            </div>`;
    }

    // Update the individual span elements
    document.getElementById('emi-value').textContent = `${currencySymbol}${emi.toFixed(2)}`;
    document.getElementById('total-interest').textContent = `${currencySymbol}${totalInterest.toFixed(2)}`;
    document.getElementById('total-payment').textContent = `${currencySymbol}${totalPayments.toFixed(2)}`;

    // Update prepayment-related fields
    const monthsSavedElement = document.getElementById('months-saved');
    const interestSavedElement = document.getElementById('interest-saved');
    const monthsSavedValue = document.getElementById('months-saved-value');
    const interestSavedValue = document.getElementById('interest-saved-value');

    if (prepayment > 0) {
        monthsSavedElement.style.display = 'flex';
        interestSavedElement.style.display = 'flex';
        monthsSavedValue.textContent = (tenureMonths - actualMonths);
        interestSavedValue.textContent = `${currencySymbol}${(baseEmi * tenureMonths - loanAmount - totalInterest).toFixed(2)}`;
    } else {
        monthsSavedElement.style.display = 'none';
        interestSavedElement.style.display = 'none';
    }

    emiResult.classList.add('show');

    generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, prepayment, currency, loanType, annualRate);
}

// Helper function to calculate EMI with prepayment
function calculateWithPrepayment(loanAmount, monthlyRate, tenureMonths, baseEmi, prepayment) {
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPayments = 0;
    let months = 0;

    while (remainingBalance > 0 && months < tenureMonths) {
        months++;
        const interest = remainingBalance * monthlyRate;
        totalInterest += interest;
        const payment = Math.min(baseEmi + prepayment, remainingBalance + interest);
        const principal = payment - interest;
        remainingBalance -= principal;
        totalPayments += payment;
        if (remainingBalance < 0) remainingBalance = 0;
    }

    return {
        emi: baseEmi,
        actualMonths: months,
        totalInterest: totalInterest,
        totalPayments: totalPayments
    };
}

// Function to calculate EMI and scroll to results
function calculateAndScroll() {
    calculateEMI();
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to reset the form, sliders, and results
function resetForm() {
    console.log("resetForm triggered"); // Debugging log
    const form = document.getElementById('emi-form');
    form.reset();

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

    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    const downloadBtn = document.getElementById('download-pdf');

    // Rebuild the #emi-result structure to ensure all elements are present
    emiResult.innerHTML = `
        <p><span class="icon">💳</span> Your EMI is: <span id="emi-value"></span></p>
        <div id="payment-summary">
            <p><span class="icon">🎯</span> Total Interest Paid: <span id="total-interest"></span></p>
            <p>Total Amount Paid: <span id="total-payment"></span></p>
            <p id="months-saved" style="display: none;">Months Saved: <span id="months-saved-value"></span></p>
            <p id="interest-saved" style="display: none;">Interest Saved: <span id="interest-saved-value"></span></p>
        </div>`;

    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');
    if (downloadBtn) downloadBtn.style.display = 'none';

    if (window.myChart) {
        window.myChart.destroy();
        window.myChart = null;
    }

    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';

    // Reinitialize sliders and ensure event listeners are reattached
    initializeSliders();

    // Manually trigger calculateEMI to handle default values after reset
    setTimeout(() => {
        calculateEMI();
    }, 0); // Use setTimeout to ensure DOM updates are complete
}

// Function to initialize sliders and sync with number inputs, including currency toggle
function initializeSliders() {
    const sliders = document.querySelectorAll('.slider');
    const inputs = document.querySelectorAll('#emi-form input[type="number"], #emi-form select');

    // Handle sliders
    sliders.forEach(slider => {
        const inputId = slider.getAttribute('data-input');
        const numberInput = document.getElementById(inputId);
        numberInput.value = slider.value;

        // Remove existing event listeners to prevent duplicates
        slider.removeEventListener('input', slider.inputHandler);
        numberInput.removeEventListener('input', numberInput.inputHandler);

        // Add new event listeners with debugging logs
        slider.inputHandler = () => {
            console.log(`Slider ${inputId} changed to ${slider.value}`); // Debugging log
            numberInput.value = slider.value;
            calculateEMI();
        };
        numberInput.inputHandler = () => {
            console.log(`Number input ${inputId} changed to ${numberInput.value}`); // Debugging log
            let value = parseFloat(numberInput.value);
            if (value < slider.min) value = slider.min;
            if (value > slider.max) value = slider.max;
            if (isNaN(value)) value = slider.min;
            slider.value = value;
            calculateEMI();
        };

        slider.addEventListener('input', slider.inputHandler);
        numberInput.addEventListener('input', numberInput.inputHandler);
    });

    // Handle currency toggle and other inputs
    inputs.forEach(input => {
        // Remove existing event listeners to prevent duplicates
        input.removeEventListener('change', input.changeHandler);
        input.removeEventListener('input', input.inputHandler);

        // Add event listeners for change and input events
        input.changeHandler = () => {
            console.log(`Input ${input.id} changed to ${input.value}`); // Debugging log
            calculateEMI();
        };
        input.inputHandler = () => {
            console.log(`Input ${input.id} input to ${input.value}`); // Debugging log
            calculateEMI();
        };

        input.addEventListener('change', input.changeHandler);
        input.addEventListener('input', input.inputHandler);
    });

    // Handle currency toggle specifically
    const currencySelect = document.getElementById('currency');
    const currencySymbols = document.querySelectorAll('#currency-symbol, #currency-symbol-prepayment, #currency-symbol-fees, #currency-symbol-taxes');
    
    // Remove existing event listener to prevent duplicates
    currencySelect.removeEventListener('change', currencySelect.changeHandler);

    // Add new event listener
    currencySelect.changeHandler = () => {
        console.log(`Currency changed to ${currencySelect.value}`); // Debugging log
        const symbol = currencySelect.value === 'CAD' ? 'C$' : '$';
        currencySymbols.forEach(span => span.textContent = symbol);
        calculateEMI();
    };
    currencySelect.addEventListener('change', currencySelect.changeHandler);

    // Set initial currency symbol
    const initialSymbol = currencySelect.value === 'CAD' ? 'C$' : '$';
    currencySymbols.forEach(span => span.textContent = initialSymbol);
}

// Initialize sliders and currency toggle on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSliders();
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) downloadBtn.style.display = 'none';
});

let chartInstance = null;

function generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, prepayment, currency, loanType, annualRate) {
    let balance = loanAmount;
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = '';
    const balances = [];
    let totalInterest = 0;

    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

    for (let i = 0; balance > 0 && i < tenureMonths; i++) {
        const interest = balance * monthlyRate;
        totalInterest += interest;
        const payment = Math.min(emi + prepayment, balance + interest);
        const principal = payment - interest;
        balance -= principal;

        balances.push(balance.toFixed(2));

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Month">${i + 1}</td>
            <td data-label="Payment">${currencySymbol}${payment.toFixed(2)}</td>
            <td data-label="Principal">${currencySymbol}${principal.toFixed(2)}</td>
            <td data-label="Interest">${currencySymbol}${interest.toFixed(2)}</td>
            <td data-label="Balance">${currencySymbol}${balance.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    }

    const table = document.getElementById('amortization-table');
    table.style.display = 'table';
    setTimeout(() => table.classList.add('show'), 10);

    const chartCanvas = document.getElementById('balance-chart');
    const dpr = window.devicePixelRatio || 1;
    chartCanvas.width = 800 * dpr;
    chartCanvas.height = 400 * dpr;
    chartCanvas.style.width = '100%';
    chartCanvas.style.height = '400px';
    const ctx = chartCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (window.myChart) window.myChart.destroy();

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
            scales: {
                x: { title: { display: true, text: 'Month' }, type: 'linear', position: 'bottom', max: tenureMonths, ticks: { stepSize: 1 } },
                y: { title: { display: true, text: `Balance (${currencySymbol})` }, beginAtZero: true, suggestedMax: loanAmount * 1.1 }
            },
            plugins: { legend: { display: true, position: 'top' }, tooltip: { enabled: true } },
            layout: { padding: 20 }
        }
    });
    setTimeout(() => chartCanvas.classList.add('show'), 10);

    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) downloadBtn.style.display = 'block';
}

// Function to download the amortization schedule as a PDF with additional details
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const currency = document.getElementById('currency').value;
    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

    doc.text("Amortization Schedule", 10, 10);
    const loanDetails = [
        `Currency: ${currency}`,
        `Loan Type: ${document.getElementById('loan-type').value === 'home' ? 'Home Loan' : document.getElementById('loan-type').value === 'car' ? 'Car Loan' : 'General'}`,
        `Loan Amount: ${currencySymbol}${parseFloat(document.getElementById('loan-amount').value).toFixed(2)}`,
        `Fees: ${currencySymbol}${parseFloat(document.getElementById('fees').value || 0).toFixed(2)}`,
        `Taxes: ${currencySymbol}${parseFloat(document.getElementById('taxes').value || 0).toFixed(2)}`,
        `Interest Rate: ${document.getElementById('interest-rate').value}%`,
        `EMI: ${currencySymbol}${parseFloat(document.getElementById('emi-value').textContent).toFixed(2)}`
    ];
    let startY = 20;
    loanDetails.forEach((detail, index) => doc.text(detail, 10, startY + (index * 10)));
    startY += (loanDetails.length * 10) + 10;

    const table = document.getElementById('amortization-table');
    const rows = table.querySelectorAll('tr');
    const tableData = [];
    const headers = ['Month', 'Payment', 'Principal', 'Interest', 'Balance'];
    tableData.push(headers);

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length) {
            const rowData = [];
            cells.forEach(cell => rowData.push(cell.textContent));
            tableData.push(rowData);
        }
    });

    doc.autoTable({
        startY: startY,
        head: [tableData[0]],
        body: tableData.slice(1),
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } }
    });

    doc.save("amortization_schedule.pdf");
}

// Add event listener for the download button
document.getElementById('download-pdf').addEventListener('click', downloadPDF);