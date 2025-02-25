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
    generateAmortization(loanAmount, monthlyRate, tenureMonths, emi);
}

function calculateAndScroll() {
    calculateEMI(); // Run the calculation
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' }); // Scroll smoothly to Results
    }
}

function generateAmortization(loanAmount, monthlyRate, tenureMonths, emi, extraPayment = 0, extraFrequency = 0) {
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

        if (balance <= 0) break; // Stop if paid off early
    }
    const table = document.getElementById('amortization-table');
    table.style.display = 'table';
    setTimeout(() => table.classList.add('show'), 10);

    const ctx = document.getElementById('balance-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: balances.length }, (_, i) => i + 1),
            datasets: [{
                label: 'Remaining Balance',
                data: balances,
                borderColor: 'blue',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Balance ($)' } }
            }
        }
    });
}