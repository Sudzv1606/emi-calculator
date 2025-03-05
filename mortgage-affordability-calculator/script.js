document.getElementById('calculator-form').addEventListener('submit', function(event) {
  event.preventDefault();
  calculateAffordability();
});

document.getElementById('calculator-form').addEventListener('reset', function() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.classList.remove('show');
  resultsDiv.innerHTML = ''; // Clear results on reset
});

function calculateAffordability() {
  // Get input values
  const income = parseFloat(document.getElementById('income').value);
  const debt = parseFloat(document.getElementById('debt').value);
  const downPayment = parseFloat(document.getElementById('down-payment').value);
  const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
  const loanTerm = parseInt(document.getElementById('loan-term').value);

  const resultsDiv = document.getElementById('results');

  // Validate inputs
  if (isNaN(income) || isNaN(debt) || isNaN(downPayment) || isNaN(interestRate) || isNaN(loanTerm)) {
    resultsDiv.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> Please enter valid numbers for all fields.</p>';
    resultsDiv.classList.add('show');
    return;
  }

  // Calculate maximum monthly mortgage payment (36% DTI)
  const monthlyIncome = income / 12;
  const maxTotalDebtPayment = monthlyIncome * 0.36;
  const maxMortgagePayment = maxTotalDebtPayment - debt;

  // Check if mortgage payment is feasible
  if (maxMortgagePayment <= 0) {
    resultsDiv.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> Based on your debt, you may not qualify for a mortgage.</p>';
    resultsDiv.classList.add('show');
    return;
  }

  // Calculate loan amount
  const monthlyRate = interestRate / 12;
  const numPayments = loanTerm * 12;
  const loanAmount = maxMortgagePayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;

  // Calculate maximum home price
  const maxHomePrice = loanAmount + downPayment;

  // Display results with icons
  resultsDiv.innerHTML = `
    <p><i class="fas fa-dollar-sign"></i> Maximum Loan Amount: ${formatCurrency(loanAmount)}</p>
    <p><i class="fas fa-home"></i> Maximum Home Price: ${formatCurrency(maxHomePrice)}</p>
  `;
  resultsDiv.classList.add('show');
}

// Format numbers as currency
function formatCurrency(amount) {
  return 'C$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
