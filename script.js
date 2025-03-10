const loanTypeInterestRates = {
    general: 10,
    home: 5,
    car: 7
};

let dynamicExchangeRate = {
    CADtoUSD: 0.74,
    USDtoCAD: 1 / 0.74
};

// Define the list of blog posts for search and suggestions
const blogPosts = [
    { title: "What is EMI?", url: "what-is-emi.html" },
    { title: "How Does EMI Work?", url: "how-emi-works.html" },
    { title: "EMI vs. Simple Interest Loan", url: "emi-vs-simple-interest.html" },
    { title: "Fixed vs. Reducing Balance EMI", url: "fixed-vs-reducing-emi.html" },
    { title: "How Loan Amortization Works", url: "loan-amortization-emi.html" },
    { title: "EMI Calculation Formula", url: "emi-calculation-formula.html" },
    { title: "How Interest Rate Affects EMI", url: "interest-rate-emi-impact.html" },
    { title: "Loan Tenure vs. EMI", url: "loan-tenure-emi.html" },
    { title: "Principal, Interest & EMI", url: "principal-interest-emi.html" },
    { title: "Extra Payments and EMI", url: "extra-payments-emi.html" },
    { title: "Home Loan EMI", url: "home-loan-emi.html" },
    { title: "Car Loan EMI", url: "car-loan-emi.html" },
    { title: "Student Loan EMI", url: "student-loan-emi.html" },
    { title: "Personal Loan EMI", url: "personal-loan-emi.html" },
    { title: "Business Loan EMI", url: "business-loan-emi.html" },
    { title: "Fixed-Rate vs. Variable-Rate Loans", url: "fixed-vs-variable-loans.html" },
    { title: "Longer vs. Shorter Loan Tenure", url: "longer-shorter-tenure.html" },
    { title: "How to Reduce Your EMI", url: "reduce-emi-tips.html" },
    { title: "Credit Score and EMI", url: "credit-score-emi.html" },
    { title: "Refinancing Loans to Reduce EMI", url: "refinancing-loans.html" },
    { title: "EMI vs. Rent: Buy or Rent?", url: "emi-vs-rent.html" },
    { title: "Managing Multiple EMIs", url: "manage-multiple-emis.html" },
    { title: "Plan Your Budget Around EMI", url: "budget-emi-payments.html" },
    { title: "Prepayment vs. Increasing EMI", url: "prepayment-vs-emi.html" },
    { title: "Using an EMI Calculator for Planning", url: "use-emi-calculator.html" }
];

async function fetchExchangeRate() {
    try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/CAD');
        const data = await response.json();
        if (data.result === 'success') {
            dynamicExchangeRate.CADtoUSD = data.conversion_rates.USD;
            dynamicExchangeRate.USDtoCAD = 1 / data.conversion_rates.USD;
            console.log(`Updated exchange rate: 1 CAD = ${dynamicExchangeRate.CADtoUSD} USD`);
        } else {
            console.error('Failed to fetch exchange rate:', data);
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        dynamicExchangeRate.CADtoUSD = 0.74;
        dynamicExchangeRate.USDtoCAD = 1 / 0.74;
    }
}

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

    if (isNaN(annualRate) || annualRate <= 0) {
        annualRate = loanTypeInterestRates[loanType] || 5;
    }

    if (currency === 'USD') {
        loanAmount *= dynamicExchangeRate.CADtoUSD;
        prepayment *= dynamicExchangeRate.CADtoUSD;
        fees *= dynamicExchangeRate.CADtoUSD;
        taxes *= dynamicExchangeRate.CADtoUSD;
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

function toggleCompareMode() {
    const comparisonTable = document.getElementById('comparison-table');
    if (comparisonTable.style.display === 'none' || comparisonTable.style.display === '') {
        comparisonTable.style.display = 'block';
        const currency = document.getElementById('currency').value;
        const symbol = currency === 'CAD' ? 'C$' : '$';
        document.getElementById('currency-symbol-scenario1').textContent = symbol;
        document.getElementById('currency-symbol-scenario1-prepayment').textContent = symbol;
        document.getElementById('currency-symbol-scenario2').textContent = symbol;
        document.getElementById('currency-symbol-scenario2-prepayment').textContent = symbol;
    } else {
        comparisonTable.style.display = 'none';
    }
}

function compareScenarios() {
    const currency = document.getElementById('currency').value;
    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

    let loanAmount1 = parseFloat(document.getElementById('scenario1-loan-amount').value);
    let annualRate1 = parseFloat(document.getElementById('scenario1-interest-rate').value);
    const tenureYears1 = parseInt(document.getElementById('scenario1-tenure').value);
    let prepayment1 = parseFloat(document.getElementById('scenario1-prepayment').value) || 0;

    let loanAmount2 = parseFloat(document.getElementById('scenario2-loan-amount').value);
    let annualRate2 = parseFloat(document.getElementById('scenario2-interest-rate').value);
    const tenureYears2 = parseInt(document.getElementById('scenario2-tenure').value);
    let prepayment2 = parseFloat(document.getElementById('scenario2-prepayment').value) || 0;

    if (isNaN(annualRate1) || annualRate1 <= 0) {
        annualRate1 = loanTypeInterestRates[document.getElementById('loan-type').value] || 5;
    }
    if (isNaN(annualRate2) || annualRate2 <= 0) {
        annualRate2 = loanTypeInterestRates[document.getElementById('loan-type').value] || 5;
    }

    if (currency === 'USD') {
        loanAmount1 *= dynamicExchangeRate.CADtoUSD;
        prepayment1 *= dynamicExchangeRate.CADtoUSD;
        loanAmount2 *= dynamicExchangeRate.CADtoUSD;
        prepayment2 *= dynamicExchangeRate.CADtoUSD;
    }

    const monthlyRate1 = annualRate1 / 100 / 12;
    const tenureMonths1 = tenureYears1 * 12;
    const numerator1 = loanAmount1 * monthlyRate1 * Math.pow(1 + monthlyRate1, tenureMonths1);
    const denominator1 = Math.pow(1 + monthlyRate1, tenureMonths1) - 1;
    const baseEmi1 = numerator1 / denominator1 || 0;
    const result1 = calculateWithPrepayment(loanAmount1, monthlyRate1, tenureMonths1, baseEmi1, prepayment1);

    const monthlyRate2 = annualRate2 / 100 / 12;
    const tenureMonths2 = tenureYears2 * 12;
    const numerator2 = loanAmount2 * monthlyRate2 * Math.pow(1 + monthlyRate2, tenureMonths2);
    const denominator2 = Math.pow(1 + monthlyRate2, tenureMonths2) - 1;
    const baseEmi2 = numerator2 / denominator2 || 0;
    const result2 = calculateWithPrepayment(loanAmount2, monthlyRate2, tenureMonths2, baseEmi2, prepayment2);

    document.getElementById('scenario1-emi').textContent = `${currencySymbol}${result1.emi.toFixed(2)}`;
    document.getElementById('scenario1-emi').setAttribute('data-scenario', 'Scenario 1');
    document.getElementById('scenario1-total-interest').textContent = `${currencySymbol}${result1.totalInterest.toFixed(2)}`;
    document.getElementById('scenario1-total-interest').setAttribute('data-scenario', 'Scenario 1');
    document.getElementById('scenario1-total-payment').textContent = `${currencySymbol}${result1.totalPayments.toFixed(2)}`;
    document.getElementById('scenario1-total-payment').setAttribute('data-scenario', 'Scenario 1');
    
    document.getElementById('scenario2-emi').textContent = `${currencySymbol}${result2.emi.toFixed(2)}`;
    document.getElementById('scenario2-emi').setAttribute('data-scenario', 'Scenario 2');
    document.getElementById('scenario2-total-interest').textContent = `${currencySymbol}${result2.totalInterest.toFixed(2)}`;
    document.getElementById('scenario2-total-interest').setAttribute('data-scenario', 'Scenario 2');
    document.getElementById('scenario2-total-payment').textContent = `${currencySymbol}${result2.totalPayments.toFixed(2)}`;
    document.getElementById('scenario2-total-payment').setAttribute('data-scenario', 'Scenario 2');

    const monthsSavedRow = document.getElementById('scenario1-months-saved-row');
    const interestSavedRow = document.getElementById('scenario1-interest-saved-row');
    if (prepayment1 > 0 || prepayment2 > 0) {
        monthsSavedRow.style.display = 'table-row';
        interestSavedRow.style.display = 'table-row';
        document.getElementById('scenario1-months-saved').textContent = prepayment1 > 0 ? (tenureMonths1 - result1.actualMonths) : 'N/A';
        document.getElementById('scenario1-months-saved').setAttribute('data-scenario', 'Scenario 1');
        document.getElementById('scenario1-interest-saved').textContent = prepayment1 > 0 ? `${currencySymbol}${(baseEmi1 * tenureMonths1 - loanAmount1 - result1.totalInterest).toFixed(2)}` : 'N/A';
        document.getElementById('scenario1-interest-saved').setAttribute('data-scenario', 'Scenario 1');
        document.getElementById('scenario2-months-saved').textContent = prepayment2 > 0 ? (tenureMonths2 - result2.actualMonths) : 'N/A';
        document.getElementById('scenario2-months-saved').setAttribute('data-scenario', 'Scenario 2');
        document.getElementById('scenario2-interest-saved').textContent = prepayment2 > 0 ? `${currencySymbol}${(baseEmi2 * tenureMonths2 - loanAmount2 - result2.totalInterest).toFixed(2)}` : 'N/A';
        document.getElementById('scenario2-interest-saved').setAttribute('data-scenario', 'Scenario 2');
    } else {
        monthsSavedRow.style.display = 'none';
        interestSavedRow.style.display = 'none';
    }

    document.getElementById('comparison-table-data').style.display = 'table';
}

function calculateBorrowingCapacity() {
    const monthlyIncome = parseFloat(document.getElementById('monthly-income').value);
    const monthlyExpenses = parseFloat(document.getElementById('monthly-expenses').value);
    const annualRate = parseFloat(document.getElementById('borrowing-interest-rate').value);
    const tenureYears = parseInt(document.getElementById('borrowing-tenure').value);
    const currency = document.getElementById('currency').value;
    const currencySymbol = currency === 'CAD' ? 'C$' : '$';

    if (isNaN(monthlyIncome) || monthlyIncome <= 0 || isNaN(monthlyExpenses) || monthlyExpenses < 0 || monthlyExpenses > monthlyIncome) {
        document.getElementById('borrowing-result').innerHTML = "<p>Please enter valid monthly income and expenses.</p>";
        document.getElementById('borrowing-result').style.display = 'block';
        return;
    }
    if (isNaN(annualRate) || annualRate <= 0) {
        document.getElementById('borrowing-result').innerHTML = "<p>Please enter a valid positive interest rate.</p>";
        document.getElementById('borrowing-result').style.display = 'block';
        return;
    }
    if (isNaN(tenureYears) || tenureYears <= 0) {
        document.getElementById('borrowing-result').innerHTML = "<p>Please enter a valid tenure in years.</p>";
        document.getElementById('borrowing-result').style.display = 'block';
        return;
    }

    const dtiRatio = 0.36;
    const monthlyPaymentCapacity = (monthlyIncome * dtiRatio) - monthlyExpenses;

    if (monthlyPaymentCapacity <= 0) {
        document.getElementById('borrowing-result').innerHTML = "<p>Your expenses exceed your debt payment capacity. Consider reducing expenses or increasing income.</p>";
        document.getElementById('borrowing-result').style.display = 'block';
        return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const tenureMonths = tenureYears * 12;
    const maxLoanAmount = (monthlyPaymentCapacity * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));

    let displayLoanAmount = maxLoanAmount;
    let displayEmi = monthlyPaymentCapacity;
    if (currency === 'USD') {
        displayLoanAmount *= dynamicExchangeRate.CADtoUSD;
        displayEmi *= dynamicExchangeRate.CADtoUSD;
    }

    document.getElementById('max-loan-amount').textContent = `${currencySymbol}${displayLoanAmount.toFixed(2)}`;
    document.getElementById('borrowing-emi').textContent = `${currencySymbol}${displayEmi.toFixed(2)}`;
    document.getElementById('borrowing-result').style.display = 'block';
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
    const comparisonTable = document.getElementById('comparison-table');

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

    comparisonTable.style.display = 'none';
    document.getElementById('comparison-table-data').style.display = 'none';

    // Reset the borrowing calculator inputs
    document.getElementById('monthly-income').value = 5000;
    document.getElementById('monthly-expenses').value = 2000;
    document.getElementById('borrowing-interest-rate').value = 5;
    document.getElementById('borrowing-tenure').value = 5;
    document.getElementById('borrowing-result').style.display = 'none';

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
    // Check if the required elements exist before proceeding
    const loanAmountInput = document.getElementById('loan-amount');
    if (!loanAmountInput) {
        console.log("Loan amount input not found, skipping slider initialization.");
        return; // Exit if we're not on a page with the calculator
    }

    const sliders = document.querySelectorAll('.slider');
    const inputs = document.querySelectorAll('#emi-form input[type="number"], #emi-form select, #borrowing-calculator input[type="number"]');

    sliders.forEach(slider => {
        const inputId = slider.getAttribute('data-input');
        const numberInput = document.getElementById(inputId);
        if (!numberInput) {
            console.log(`Number input ${inputId} not found, skipping this slider.`);
            return;
        }
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
    const currencySymbols = document.querySelectorAll('#currency-symbol, #currency-symbol-prepayment, #currency-symbol-fees, #currency-symbol-taxes, #currency-symbol-scenario1, #currency-symbol-scenario1-prepayment, #currency-symbol-scenario2, #currency-symbol-scenario2-prepayment, #currency-symbol-monthly-income, #currency-symbol-monthly-expenses');
    
    if (currencySelect) {
        currencySelect.removeEventListener('change', currencySelect.changeHandler);

        currencySelect.changeHandler = async () => {
            console.log(`Currency changed to ${currencySelect.value}`);
            const symbol = currencySelect.value === 'CAD' ? 'C$' : '$';
            currencySymbols.forEach(span => span.textContent = symbol);
            
            await fetchExchangeRate();
            
            calculateEMI();
        };
        currencySelect.addEventListener('change', currencySelect.changeHandler);

        const initialSymbol = currencySelect.value === 'CAD' ? 'C$' : '$';
        currencySymbols.forEach(span => span.textContent = initialSymbol);

        fetchExchangeRate();
    }
}

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

// Search Functionality with Suggestions
function initializeSearch() {
    console.log("Initializing search functionality...");
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('suggestionsContainer');

    if (!searchForm || !searchInput || !suggestionsContainer) {
        console.error("Search elements not found:", {
            searchForm: !!searchForm,
            searchInput: !!searchInput,
            suggestionsContainer: !!suggestionsContainer
        });
        return;
    }

    console.log("Search elements found, setting up event listeners...");

    // Handle form submission
    searchForm.addEventListener('submit', (e) => {
        console.log("Search form submitted");
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            const matchedPost = blogPosts.find(post => post.title.toLowerCase().includes(query));
            if (matchedPost) {
                console.log(`Redirecting to ${matchedPost.url}`);
                window.location.href = matchedPost.url;
            } else {
                console.log("No matching blog post found for query:", query);
                alert('No matching blog post found. Please try a different search term.');
            }
        }
    });

    // Handle input for suggestions
    searchInput.addEventListener('input', () => {
        console.log("Search input changed:", searchInput.value);
        const query = searchInput.value.trim().toLowerCase();
        suggestionsContainer.innerHTML = ''; // Clear previous suggestions

        if (query) {
            const matches = blogPosts.filter(post => post.title.toLowerCase().includes(query));
            console.log("Suggestions found:", matches);
            if (matches.length > 0) {
                matches.forEach(post => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = post.title;
                    suggestionItem.addEventListener('click', () => {
                        console.log(`Suggestion clicked, redirecting to ${post.url}`);
                        window.location.href = post.url;
                    });
                    suggestionsContainer.appendChild(suggestionItem);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            console.log("Clicked outside, hiding suggestions");
            suggestionsContainer.style.display = 'none';
        }
    });

    // Handle focus to show suggestions if there are any
    searchInput.addEventListener('focus', () => {
        console.log("Search input focused");
        if (suggestionsContainer.innerHTML) {
            suggestionsContainer.style.display = 'block';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing...");
    initializeSliders();
    initializeSearch();
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.style.display = 'none';
        downloadBtn.addEventListener('click', downloadPDF);
    }
});