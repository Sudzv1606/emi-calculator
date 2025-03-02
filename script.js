const loanTypeInterestRates = {
    general: 10,  // Personal loans typically have higher rates
    home: 5,      // Home loans (mortgages) typically have lower rates
    car: 7        // Car loans are often in between
};

const exchangeRate = {
    CADtoUSD: 0.74, // 1 CAD = 0.74 USD
    USDtoCAD: 1 / 0.74 // 1 USD = 1.35 CAD
};

function calculateEMI() {
    console.log("calculateEMI triggered");
    const emiResult = document.getElementById('emi-result');
    const table = document.getElementById('amortization-table');
    const chartCanvas = document.getElementById('balance-chart');
    const downloadBtn = document.getElementById('download-pdf');
    emiResult.classList.remove('show');
    table.style.display = 'none';
    table.classList.remove('show');
    chartCanvas.classList.remove('show');
    if (downloadBtn) downloadBtn.style.display = 'none';

    const currency = document.getElementById('currency').value;
    const loanType = document.getElementById('loan-type').value;
    let loanAmount = parseFloat(document.getElementById('loan-amount').value);
    let annualRate = parseFloat(document.getElementById('interest-rate').value);
    const tenureYears = parseInt(document.getElementById('tenure').value);
    let prepayment = parseFloat(document.getElementById('prepayment').value) || 0;
    let fees = parseFloat(document.getElementById('fees').value) || 0;
    let taxes = parseFloat(document.getElementById('taxes').value) || 0;

    // Adjust interest rate based on loan type if the user hasn't provided a custom rate
    if (isNaN(annualRate) || annualRate <= 0) {
        annualRate = loanTypeInterestRates[loanType] || 5;
    }

    // Convert all monetary values to the selected currency (base currency is CAD)
    if (currency === 'USD') {
        loanAmount *= exchangeRate.CADtoUSD;
        prepayment *= exchangeRate.CADtoUSD;
        fees *= exchangeRate.CADtoUSD;
        taxes *= exchangeRate.CADtoUSD;
    }

    loanAmount += fees + taxes;

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

    const monthlyRate = annualRate / 100 / 12;
    const tenureMonths = tenureYears * 12;

    const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const baseEmi = numerator / denominator || 0;

    const { emi, actualMonths, totalInterest, totalPayments } = calculateWithPrepayment(loanAmount, monthlyRate, tenureMonths, baseEmi, prepayment);

    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

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

    document.getElementById('emi-value').textContent = `${currencySymbol}${emi.toFixed(2)}`;
    document.getElementById('total-interest').textContent = `${currencySymbol}${totalInterest.toFixed(2)}`;
    document.getElementById('total-payment').textContent = `${currencySymbol}${totalPayments.toFixed(2)}`;

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

function calculateAndScroll() {
    calculateEMI();
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetForm() {
    console.log("resetForm triggered");
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

    initializeSliders();

    setTimeout(() => {
        calculateEMI();
    }, 0);
}

function initializeSliders() {
    const sliders = document.querySelectorAll('.slider');
    const inputs = document.querySelectorAll('#emi-form input[type="number"], #emi-form select');

    sliders.forEach(slider => {
        const inputId = slider.getAttribute('data-input');
        const numberInput = document.getElementById(inputId);
        numberInput.value = slider.value;

        slider.removeEventListener('input', slider.inputHandler);
        numberInput.removeEventListener('input', numberInput.inputHandler);

        slider.inputHandler = () => {
            console.log(`Slider ${inputId} changed to ${slider.value}`);
            numberInput.value = slider.value;
            calculateEMI();
        };
        numberInput.inputHandler = () => {
            console.log(`Number input ${inputId} changed to ${numberInput.value}`);
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

    inputs.forEach(input => {
        input.removeEventListener('change', input.changeHandler);
        input.removeEventListener('input', input.inputHandler);

        input.changeHandler = () => {
            console.log(`Input ${input.id} changed to ${input.value}`);
            calculateEMI();
        };
        input.inputHandler = () => {
            console.log(`Input ${input.id} input to ${input.value}`);
            calculateEMI();
        };

        input.addEventListener('change', input.changeHandler);
        input.addEventListener('input', input.inputHandler);
    });

    const currencySelect = document.getElementById('currency');
    const currencySymbols = document.querySelectorAll('#currency-symbol, #currency-symbol-prepayment, #currency-symbol-fees, #currency-symbol-taxes');
    
    currencySelect.removeEventListener('change', currencySelect.changeHandler);

    currencySelect.changeHandler = () => {
        console.log(`Currency changed to ${currencySelect.value}`);
        const symbol = currencySelect.value === 'CAD' ? 'C$' : '$';
        currencySymbols.forEach(span => span.textContent = symbol);
        calculateEMI();
    };
    currencySelect.addEventListener('change', currencySelect.changeHandler);

    const initialSymbol = currencySelect.value === 'CAD' ? 'C$' : '$';
    currencySymbols.forEach(span => span.textContent = initialSymbol);
}

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

document.getElementById('download-pdf').addEventListener('click', downloadPDF);