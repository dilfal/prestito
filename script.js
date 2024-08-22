
document.getElementById('calculationType').addEventListener('change', function() {
    const calcType = document.getElementById('calculationType').value;
    console.log('Tipo di calcolo selezionato:', calcType);
    if (calcType === 'fromRate') {
        document.getElementById('rateInputGroup').style.display = 'block';
        document.getElementById('tanInputGroup').style.display = 'none';
    } else {
        document.getElementById('rateInputGroup').style.display = 'none';
        document.getElementById('tanInputGroup').style.display = 'block';
    }
});

document.getElementById('loanForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const calcType = document.getElementById('calculationType').value;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const loanDuration = parseInt(document.getElementById('loanDuration').value);
    console.log('Calcolo iniziato con tipo:', calcType);
    console.log('Importo prestito:', loanAmount, 'Durata:', loanDuration);

    let monthlyPayment, tan, totalInterest;

    if (calcType === 'fromRate') {
        monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value);
        console.log('Rata mensile inserita:', monthlyPayment);
        tan = calculateTAN(loanAmount, loanDuration, monthlyPayment);
        console.log('TAN calcolato:', tan);
        document.getElementById('calculatedTan').textContent = (tan * 100).toFixed(2);
    } else {
        tan = parseFloat(document.getElementById('tanInput').value) / 100;
        console.log('TAN inserito:', tan);
        monthlyPayment = calculateMonthlyPayment(loanAmount, loanDuration, tan);
        console.log('Rata mensile calcolata:', monthlyPayment);
        document.getElementById('calculatedMonthlyPayment').textContent = monthlyPayment.toFixed(2);
    }

    const amortizationSchedule = generateAmortizationSchedule(loanAmount, loanDuration, tan, monthlyPayment);
    totalInterest = amortizationSchedule.reduce((acc, cur) => acc + parseFloat(cur.interestPayment), 0);
    console.log('Totale interessi:', totalInterest);

    document.getElementById('totalInterest').textContent = totalInterest.toFixed(2);
    displayAmortizationSchedule(amortizationSchedule);
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('saveButton').classList.remove('hidden');

    // Prepare data for saving
    const resultText = prepareResultText(amortizationSchedule, monthlyPayment, tan, loanAmount, totalInterest);
    document.getElementById('saveButton').addEventListener('click', function() {
        saveTextAsFile(resultText, 'risultato_prestito.txt');
    });
});

function calculateTAN(principal, duration, payment) {
    let low = 0;
    let high = 1;
    let rate;

    while (high - low > 0.00001) {
        rate = (low + high) / 2;
        let calcPayment = (principal * rate) / (1 - Math.pow(1 + rate, -duration));
        if (calcPayment > payment) {
            high = rate;
        } else {
            low = rate;
        }
    }
    return rate * 12; // TAN annuale
}

function calculateMonthlyPayment(principal, duration, annualRate) {
    const monthlyRate = annualRate / 12;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
}

function generateAmortizationSchedule(principal, duration, annualRate, monthlyPayment) {
    let balance = principal;
    let monthlyRate = annualRate / 12;

    const schedule = [];
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (let i = 1; i <= duration; i++) {
        let interestPayment = balance * monthlyRate;
        let principalPayment = monthlyPayment - interestPayment;

        balance -= principalPayment;
        totalInterest += interestPayment;
        totalPrincipal += principalPayment;

        schedule.push({
            month: i,
            interestPayment: interestPayment.toFixed(2),
            principalPayment: principalPayment.toFixed(2),
            totalInterest: totalInterest.toFixed(2),
            totalPrincipal: totalPrincipal.toFixed(2),
        });
    }

    return schedule;
}

function displayAmortizationSchedule(schedule) {
    const tableBody = document.querySelector('#amortizationTable tbody');
    tableBody.innerHTML = '';

    schedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>${row.interestPayment}</td>
            <td>${row.principalPayment}</td>
            <td>${row.totalInterest}</td>
            <td>${row.totalPrincipal}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function prepareResultText(schedule, monthlyPayment, tan, loanAmount, totalInterest) {
    let text = 'Importo del Prestito: €' + loanAmount.toFixed(2) + '\n';
    text += 'Durata del Prestito: ' + schedule.length + ' mesi\n';
    text += 'Rata Mensile: €' + monthlyPayment.toFixed(2) + '\n';
    text += 'TAN: ' + (tan * 100).toFixed(2) + '%\n';
    text += 'Totale Interessi Pagati: €' + totalInterest.toFixed(2) + '\n\n';
    text += 'Piano di Ammortamento:\n';
    text += 'Mese\tInteressi Pagati (€)\tCapitale Pagato (€)\tTotale Interessi (€)\tTotale Capitale (€)\n';

    schedule.forEach(row => {
        text += row.month + '\t' + row.interestPayment + '\t' + row.principalPayment + '\t' + row.totalInterest + '\t' + row.totalPrincipal + '\n';
    });

    return text;
}

function saveTextAsFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.click();
}
