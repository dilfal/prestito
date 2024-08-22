document.addEventListener('DOMContentLoaded', function() {
    const modeSelector = document.getElementById('calculation-mode');
    const rateCalculationSection = document.getElementById('rate-calculation-section');
    const tanTaegCalculationSection = document.getElementById('tan-taeg-calculation-section');
    const resultsSection = document.getElementById('results');

    const lightModeIcon = document.getElementById('light-mode-icon');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    const body = document.body;

    // Imposta la sezione di default su "Calcolo dell'importo della rata"
    rateCalculationSection.style.display = 'block';
    tanTaegCalculationSection.style.display = 'none';

    // Gestione del tema
    lightModeIcon.addEventListener('click', function() {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
    });

    darkModeIcon.addEventListener('click', function() {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    });

    // Cambio tra le modalità
    modeSelector.addEventListener('change', function() {
        if (this.value === 'calculate-rate') {
            rateCalculationSection.style.display = 'block';
            tanTaegCalculationSection.style.display = 'none';
        } else {
            rateCalculationSection.style.display = 'none';
            tanTaegCalculationSection.style.display = 'block';
        }
        resultsSection.style.display = 'none'; // Nascondiamo i risultati quando cambiamo modalità
    });

    const differentFirstPaymentCheckbox = document.getElementById('different-first-payment');
    const firstPaymentContainer = document.getElementById('first-payment-container');

    // Mostra o nasconde il campo della prima rata in base al checkbox
    differentFirstPaymentCheckbox.addEventListener('change', function() {
        firstPaymentContainer.style.display = this.checked ? 'block' : 'none';
    });

    // Funzione per calcolare l'importo della rata
    document.getElementById('calculate-rate-btn').addEventListener('click', function() {
        const loanAmount = parseFloat(document.getElementById('loan-amount-rate').value);
        const loanDuration = parseFloat(document.getElementById('loan-duration-rate').value);
        const tan = parseFloat(document.getElementById('tan-rate').value);
        const taeg = parseFloat(document.getElementById('taeg-rate').value);

        if (isNaN(loanAmount) || isNaN(loanDuration) || isNaN(tan) || isNaN(taeg)) {
            alert('Per favore, inserisci tutti i valori.');
            return;
        }

        const tanMonthly = tan / 100 / 12;
        const rate = loanAmount * (tanMonthly * Math.pow(1 + tanMonthly, loanDuration)) / (Math.pow(1 + tanMonthly, loanDuration) - 1);

        // Visualizzazione dei risultati
        document.getElementById('calculated-rate').textContent = rate.toFixed(2);
        document.getElementById('tan').textContent = tan.toFixed(2);
        document.getElementById('taeg').textContent = taeg.toFixed(2);
        document.getElementById('rate-result').style.display = 'block';
        resultsSection.style.display = 'block';

        // Generazione del piano di ammortamento
        const amortizationSchedule = document.getElementById('amortization-schedule').getElementsByTagName('tbody')[0];
        amortizationSchedule.innerHTML = ''; // Svuotiamo la tabella

        let balance = loanAmount;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        let amortizationData = [];
        let remainingInterest = 0;

        for (let month = 1; month <= loanDuration; month++) {
            const interest = balance * tanMonthly;
            const principal = rate - interest;

            balance -= principal;
            totalInterestPaid += interest;
            totalPrincipalPaid += principal;
            remainingInterest += interest;

            const row = amortizationSchedule.insertRow();
            row.insertCell(0).textContent = month;
            row.insertCell(1).textContent = principal.toFixed(2);
            row.insertCell(2).textContent = interest.toFixed(2);
            row.insertCell(3).textContent = totalPrincipalPaid.toFixed(2);
            row.insertCell(4).textContent = totalInterestPaid.toFixed(2);
            row.insertCell(5).textContent = balance.toFixed(2);
            row.insertCell(6).textContent = remainingInterest.toFixed(2);
            row.insertCell(7).textContent = rate.toFixed(2);

            amortizationData.push([month, principal.toFixed(2), interest.toFixed(2), totalPrincipalPaid.toFixed(2), totalInterestPaid.toFixed(2), balance.toFixed(2), remainingInterest.toFixed(2), rate.toFixed(2)]);
        }
    });

    // Funzione per calcolare TAN e TAEG
    document.getElementById('calculate-btn').addEventListener('click', function() {
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const monthlyPayment = parseFloat(document.getElementById('monthly-payment').value);
        let firstPayment = monthlyPayment; // Default alla rata regolare

        if (differentFirstPaymentCheckbox.checked) {
            firstPayment = parseFloat(document.getElementById('first-payment').value);
        }

        const loanDuration = parseFloat(document.getElementById('loan-duration').value);
        const accessoryFeesInput = parseFloat(document.getElementById('accessory-fees').value);

        if (isNaN(loanAmount) || isNaN(monthlyPayment) || isNaN(loanDuration) || isNaN(accessoryFeesInput) || (differentFirstPaymentCheckbox.checked && isNaN(firstPayment))) {
            alert('Per favore, inserisci tutti i valori.');
            return;
        }

        // Calcolo del TAN
        function calculateTAN(loanAmount, monthlyPayment, loanDuration) {
            let low = 0;
            let high = 1;
            let guess = (low + high) / 2;

            while (high - low > 0.00001) {
                let rateFactor = Math.pow(1 + guess, loanDuration);
                let estimatedPayment = loanAmount * (guess * rateFactor) / (rateFactor - 1);

                if (estimatedPayment > monthlyPayment) {
                    high = guess;
                } else {
                    low = guess;
                }
                guess = (low + high) / 2;
            }

            return guess * 12 * 100;  // TAN annualizzato
        }

        const tan = calculateTAN(loanAmount, monthlyPayment, loanDuration);
        document.getElementById('tan').textContent = tan.toFixed(2);

        // Calcolo delle spese accessorie (differenza tra la prima rata e le successive + spese accessorie input dall'utente)
        const accessoryExpenses = (firstPayment - monthlyPayment) + accessoryFeesInput;

        // Calcolo del TAEG
        function calculateTAEG(tan, accessoryExpenses, loanAmount, loanDuration) {
            const n = 12;
            const r = tan / 100 / n;
            const q = accessoryExpenses / (loanAmount * (loanDuration / 12));

            const taeg = Math.pow(1 + r + q, n) - 1;
            return taeg * 100;
        }

        const taeg = calculateTAEG(tan, accessoryExpenses, loanAmount, loanDuration);
        document.getElementById('taeg').textContent = taeg.toFixed(2);
        resultsSection.style.display = 'block';

        // Generazione piano di ammortamento
        const amortizationSchedule = document.getElementById('amortization-schedule').getElementsByTagName('tbody')[0];
        amortizationSchedule.innerHTML = ''; // Svuotiamo la tabella

        let balance = loanAmount;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        let amortizationData = [];
        let remainingInterest = 0;

        for (let month = 1; month <= loanDuration; month++) {
            let interest, principal;

            if (month === 1) {
                interest = accessoryExpenses + (balance * tan / 1200);
                principal = firstPayment - interest;
            } else {
                interest = balance * tan / 1200;
                principal = monthlyPayment - interest;
            }

            balance -= principal;
            totalInterestPaid += interest;
            totalPrincipalPaid += principal;
            remainingInterest += interest;

            const row = amortizationSchedule.insertRow();
            row.insertCell(0).textContent = month;
            row.insertCell(1).textContent = principal.toFixed(2);
            row.insertCell(2).textContent = interest.toFixed(2);
            row.insertCell(3).textContent = totalPrincipalPaid.toFixed(2);
            row.insertCell(4).textContent = totalInterestPaid.toFixed(2);
            row.insertCell(5).textContent = balance.toFixed(2);
            row.insertCell(6).textContent = remainingInterest.toFixed(2);
            row.insertCell(7).textContent = month === 1 ? firstPayment.toFixed(2) : monthlyPayment.toFixed(2);

            amortizationData.push([month, principal.toFixed(2), interest.toFixed(2), totalPrincipalPaid.toFixed(2), totalInterestPaid.toFixed(2), balance.toFixed(2), remainingInterest.toFixed(2), (month === 1 ? firstPayment.toFixed(2) : monthlyPayment.toFixed(2))]);
        }

        resultsSection.style.display = 'block'; // Mostra i risultati
    });
});

