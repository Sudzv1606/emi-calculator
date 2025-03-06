// Global variable to store the chart instance
let affordabilityChart = null;

document.getElementById('calculator-form').addEventListener('submit', function(event) {
  event.preventDefault();
  calculateAffordability();
});

document.getElementById('calculator-form').addEventListener('reset', function() {
  const textResultsDiv = document.getElementById('text-results');
  textResultsDiv.classList.remove('show');
  textResultsDiv.innerHTML = ''; // Clear text results on reset

  // Destroy the chart if it exists
  if (affordabilityChart) {
    affordabilityChart.destroy();
    affordabilityChart = null;
  }

  // Hide the chart canvas
  const chartCanvas = document.getElementById('affordability-chart');
  chartCanvas.style.display = 'none';
});

function calculateAffordability() {
  // Get input values
  const income = parseFloat(document.getElementById('income').value);
  const debt = parseFloat(document.getElementById('debt').value);
  const downPayment = parseFloat(document.getElementById('down-payment').value);
  const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
  const loanTerm = parseInt(document.getElementById('loan-term').value);
  const dtiRatio = parseFloat(document.getElementById('dti-ratio').value) / 100;
  const propertyTaxes = parseFloat(document.getElementById('property-taxes').value);
  const insurance = parseFloat(document.getElementById('insurance').value);

  const textResultsDiv = document.getElementById('text-results');
  const chartCanvas = document.getElementById('affordability-chart');
  const resultsDiv = document.getElementById('results');

  // Validate inputs
  if (isNaN(income) || isNaN(debt) || isNaN(downPayment) || isNaN(interestRate) || 
      isNaN(loanTerm) || isNaN(dtiRatio) || isNaN(propertyTaxes) || isNaN(insurance)) {
    textResultsDiv.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> Please enter valid numbers for all fields.</p>';
    textResultsDiv.classList.add('show');
    return;
  }

  // Calculate monthly additional expenses (property taxes + insurance)
  const monthlyPropertyTaxes = propertyTaxes / 12;
  const monthlyInsurance = insurance / 12;
  const totalMonthlyExpenses = monthlyPropertyTaxes + monthlyInsurance;
  const totalExpensesOverTerm = totalMonthlyExpenses * (loanTerm * 12); // Total over loan term

  // Calculate maximum monthly mortgage payment using the user-defined DTI ratio
  const monthlyIncome = income / 12;
  const maxTotalDebtPayment = monthlyIncome * dtiRatio;
  const maxMortgagePayment = maxTotalDebtPayment - debt - totalMonthlyExpenses;

  // Check if mortgage payment is feasible
  if (maxMortgagePayment <= 0) {
    textResultsDiv.innerHTML = '<p><i class="fas fa-exclamation-circle"></i> Based on your debt and expenses, you may not qualify for a mortgage.</p>';
    textResultsDiv.classList.add('show');
    return;
  }

  // Calculate loan amount with rounded intermediate values
  const monthlyRate = parseFloat((interestRate / 12).toFixed(8));
  const numPayments = loanTerm * 12;
  const discountFactor = (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
  const loanAmount = maxMortgagePayment * discountFactor;

  // Calculate maximum home price
  const maxHomePrice = loanAmount + downPayment;

  // Display text results with icons
  textResultsDiv.innerHTML = `
    <p><i class="fas fa-dollar-sign"></i> Maximum Loan Amount: ${formatCurrency(loanAmount)}</p>
    <p><i class="fas fa-home"></i> Maximum Home Price: ${formatCurrency(maxHomePrice)}</p>
    <p><i class="fas fa-balance-scale"></i> Debt-to-Income Ratio Used: ${(dtiRatio * 100).toFixed(1)}%</p>
  `;
  textResultsDiv.classList.add('show');

  // Wait for the transition to complete before rendering the chart
  resultsDiv.classList.add('show');
  const renderChart = () => {
    // Destroy previous chart if it exists
    if (affordabilityChart) {
      affordabilityChart.destroy();
    }

    // Ensure the canvas is visible and has dimensions
    chartCanvas.style.display = 'block';
    chartCanvas.width = chartCanvas.offsetWidth; // Force resize
    chartCanvas.height = 300; // Match HTML height attribute

    console.log('Canvas dimensions:', chartCanvas.width, chartCanvas.height);

    try {
      // Prepare data for the chart
      const chartData = {
        labels: ['Loan Amount', 'Down Payment'],
        datasets: [{
          label: 'Home Price Breakdown (C$)',
          data: [loanAmount, downPayment],
          backgroundColor: ['#004d40', '#00bfa5'], // Navy blue and mint green
          borderColor: ['#003d30', '#009688'], // Darker shades for borders
          borderWidth: 1
        }]
      };

      // Add additional expenses over the term if non-zero
      if (totalExpensesOverTerm > 0) {
        chartData.labels.push('Expenses Over Term');
        chartData.datasets[0].data.push(totalExpensesOverTerm);
        chartData.datasets[0].backgroundColor.push('#2c3e50'); // Dark gray for expenses
        chartData.datasets[0].borderColor.push('#1a2526');
      }

      // Create the chart
      const ctx = chartCanvas.getContext('2d');
      affordabilityChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount (C$)',
                font: {
                  family: "'Inter', sans-serif",
                  size: 14,
                  weight: '700'
                },
                color: '#004d40'
              },
              ticks: {
                font: {
                  family: "'Inter', sans-serif"
                },
                color: '#2c3e50'
              }
            },
            x: {
              ticks: {
                font: {
                  family: "'Inter', sans-serif"
                },
                color: '#2c3e50'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                font: {
                  family: "'Inter', sans-serif"
                },
                color: '#2c3e50'
              }
            },
            tooltip: {
              titleFont: {
                family: "'Inter', sans-serif"
              },
              bodyFont: {
                family: "'Merriweather', serif"
              },
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                }
              }
            }
          }
        }
      });

      console.log('Chart instance:', affordabilityChart);

      // Force a resize to ensure the chart renders correctly
      setTimeout(() => {
        affordabilityChart.resize();
        console.log('Chart resized');
      }, 100);
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  };

  // Wait for the transition to complete before rendering the chart
  resultsDiv.addEventListener('transitionend', renderChart, { once: true });

  // Fallback: If transitionend doesn't fire (e.g., no transition), render after a short delay
  setTimeout(renderChart, 600);
}

// Format numbers as currency
function formatCurrency(amount) {
  return 'C$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
