
document.addEventListener('DOMContentLoaded', function() {
    // Listener per il pulsante di calcolo
    document.getElementById('calculate-btn').addEventListener('click', function() {
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const firstPayment = parseFloat(document.getElementById('first-payment').value);
        const monthlyPayment = parseFloat(document.getElementById('monthly-payment').value);
        const loanDuration = parseFloat(document.getElementById('loan-duration').value);
        const accessoryFeesInput = parseFloat(document.getElementById('accessory-fees').value);

        if (isNaN(loanAmount) || isNaN(firstPayment) || isNaN(monthlyPayment) || isNaN(loanDuration) || isNaN(accessoryFeesInput)) {
            alert('Per favore, inserisci tutti i valori.');
            return;
        }

        // Calcolo del TAN (evitando loop infinito)
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

        // Calcolo del TAEG utilizzando il TAN e le spese accessorie
        function calculateTAEG(tan, accessoryExpenses, loanAmount, loanDuration) {
            const n = 12;  // Assumendo rate mensili
            const r = tan / 100 / n;  // Tasso di interesse per rata
            const q = accessoryExpenses / (loanAmount * (loanDuration / 12));  // Quota aggiuntiva delle spese accessorie

            const taeg = Math.pow(1 + r + q, n) - 1;  // Formula del TAEG
            return taeg * 100;  // Convertiamo in percentuale
        }

        const taeg = calculateTAEG(tan, accessoryExpenses, loanAmount, loanDuration);
        document.getElementById('taeg').textContent = taeg.toFixed(2);

        // Generazione piano di ammortamento
        const amortizationSchedule = document.getElementById('amortization-schedule').getElementsByTagName('tbody')[0];
        amortizationSchedule.innerHTML = ''; // Svuotiamo la tabella

        let balance = loanAmount;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;
        let amortizationData = [];

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

            const row = amortizationSchedule.insertRow();
            row.insertCell(0).textContent = month;
            row.insertCell(1).textContent = balance.toFixed(2);
            row.insertCell(2).textContent = interest.toFixed(2);
            row.insertCell(3).textContent = principal.toFixed(2);
            row.insertCell(4).textContent = totalInterestPaid.toFixed(2);
            row.insertCell(5).textContent = totalPrincipalPaid.toFixed(2);
            row.insertCell(6).textContent = month === 1 ? firstPayment.toFixed(2) : monthlyPayment.toFixed(2);

            // Aggiunta dei dati per il foglio Excel
            amortizationData.push([month, balance.toFixed(2), interest.toFixed(2), principal.toFixed(2), totalInterestPaid.toFixed(2), totalPrincipalPaid.toFixed(2), (month === 1 ? firstPayment.toFixed(2) : monthlyPayment.toFixed(2))]);
        }

        // Listener per il pulsante di salvataggio
        document.getElementById('save-btn').addEventListener('click', function() {
            const wb = XLSX.utils.book_new();
            const wsData = [
                ["Importo Totale del Prestito (€)", loanAmount],
                ["Importo della Prima Rata (€)", firstPayment],
                ["Importo delle Rate Successive (€)", monthlyPayment],
                ["Durata del Prestito (Mesi)", loanDuration],
                ["Spese Accessorie (€)", accessoryFeesInput],
                ["TAN (%)", tan.toFixed(2)],
                ["TAEG (%)", taeg.toFixed(2)],
                [],
                ["Piano di Ammortamento"],
                ["Mese", "Capitale Residuo (€)", "Interessi Pagati (€)", "Capitale Pagato (€)", "Interessi Totali Pagati (€)", "Capitale Totale Pagato (€)", "Rata (€)"],
                ...amortizationData
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Prestito");
            XLSX.writeFile(wb, "calcolo_prestito.xlsx");
        });
    });
});
