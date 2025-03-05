document.getElementById('calculator-form').addEventListener('submit', function(event) {
    event.preventDefault();
    calculateAffordability();
  });
  
  function calculateAffordability() {
    // Get input values
    const income = parseFloat(document.getElementById('income').value);
    const debt = parseFloat(document.getElementById('debt').value);
    const downPayment = parseFloat(document.getElementById('down-payment').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
  
    // Validate inputs
    if (isNaN(income) || isNaN(debt) || isNaN(downPayment) || isNaN(interestRate) || isNaN(loanTerm)) {
      document.getElementById('results').innerHTML = '<p>Please enter valid numbers for all fields.</p>';
      return;
    }
  
    // Calculate maximum monthly mortgage payment (36% DTI)
    const monthlyIncome = income / 12;
    const maxTotalDebtPayment = monthlyIncome * 0.36;
    const maxMortgagePayment = maxTotalDebtPayment - debt;
  
    // Check if mortgage payment is feasible
    if (maxMortgagePayment <= 0) {
      document.getElementById('results').innerHTML = '<p>Based on your debt, you may not qualify for a mortgage.</p>';
      return;
    }
  
    // Calculate loan amount
    const monthlyRate = interestRate / 12;
    const numPayments = loanTerm * 12;
    const loanAmount = maxMortgagePayment * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
  
    // Calculate maximum home price
    const maxHomePrice = loanAmount + downPayment;
  
    // Display results
    document.getElementById('results').innerHTML = `
      <p>MAXIMUM LOAN AMOUNT: ${formatCurrency(loanAmount)}</p>
      <p>MAXIMUM HOME PRICE: ${formatCurrency(maxHomePrice)}</p>
    `;
  }
  
  // Format numbers as currency
  function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }