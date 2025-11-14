function calculateSectionTotal(className) {
    let total = 0;
    document.querySelectorAll(`input.${className}[type="checkbox"]`).forEach(input => {
        const points = input.checked ? parseFloat(input.dataset.points || 0) : 0;
        const wrapper = input.closest('label');
        const adjustSpan = wrapper?.querySelector('.adjust-value');
        // Pour les questions custom, le bonus est dans le deuxième .adjust-value
        let bonus = 0;
        if (wrapper) {
            const adjustSpans = wrapper.querySelectorAll('.adjust-value');
            if (adjustSpans.length > 1) {
                bonus = parseFloat(adjustSpans[1].textContent || 0);
            } else {
                bonus = parseFloat(adjustSpan?.textContent || 0);
            }
        }
        total += points + bonus;
    });
    return Math.min(10, Math.max(0, total));
}

function calculateScore() {
    const theoriqueTotal = calculateSectionTotal('theorique');
    const pratiqueTotal = calculateSectionTotal('pratique');
    const total = theoriqueTotal + pratiqueTotal;
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent =
            `Note Totale : ${total.toFixed(2)} / 20 (Théorie : ${theoriqueTotal.toFixed(2)} / 10, Pratique : ${pratiqueTotal.toFixed(2)} / 10)`;
    }
    const totalScore = document.getElementById('totalScore');
    if (totalScore) totalScore.textContent = total.toFixed(2);
}

function setupAdjustButtons() {
    document.querySelectorAll('.adjust-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const adjustSpan = btn.parentElement.querySelector('.adjust-value');
            let current = parseFloat(adjustSpan.textContent || 0);
            const delta = parseFloat(btn.dataset.adjust || 0);
            current += delta;
            adjustSpan.textContent = current.toFixed(2);
            calculateScore();
        });
    });
}

function setupCheckboxListeners() {
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', calculateScore);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupAdjustButtons();
    setupCheckboxListeners();
    calculateScore();
    const btnGen = document.getElementById('genererDiscordTexte');
    if (btnGen) btnGen.addEventListener('click', genererTexteDiscord);
});

function safeFixed(value) {
    return isNaN(value) ? "0.00" : value.toFixed(2);
}

function genererTexteDiscord() {
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const discordId = document.getElementById('discordId').value.trim();

    if (!nom || !prenom || !discordId) {
        alert("Veuillez remplir toutes les informations de l'élève.");
        return;
    }

    const sections = {
        theorique: {
            piliers: 0,
            hierarchie: 0,
            protocoles: 0,
            specialites: 0,
            codesRadio: 0
        },
        pratique: {
            typeBlessure: 0,
            rapport: 0,
            mes: 0,
            connaissance: 0
        }
    };

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const points = parseFloat(cb.dataset.points || 0);
        const part = cb.dataset.part;
        if (cb.classList.contains('theorique') && part in sections.theorique) {
            sections.theorique[part] += points;
        } else if (cb.classList.contains('pratique') && part in sections.pratique) {
            sections.pratique[part] += points;
        }
    });

    // Ajoute bonus/malus par bloc
    document.querySelectorAll('.question-block').forEach(block => {
        const adjust = parseFloat(block.querySelector('.adjust-value')?.textContent || 0);
        const input = block.querySelector('input[type="checkbox"]');
        const part = input?.dataset.part;
        if (input?.classList.contains('theorique') && part in sections.theorique) {
            sections.theorique[part] += adjust;
        } else if (input?.classList.contains('pratique') && part in sections.pratique) {
            sections.pratique[part] += adjust;
        }
    });

    const theoriqueNote = Object.values(sections.theorique).reduce((a, b) => a + b, 0);
    const pratiqueNote = Object.values(sections.pratique).reduce((a, b) => a + b, 0);
    const total = theoriqueNote + pratiqueNote;

    const isApte = total >= 12 ? "Apte" : "Inapte";
    const texte = `**__Nom des formateurs :__** <@422404651577638943> 
**__Noms de l'élève passant la formation :__** <@${discordId}>

**__Manuel SAMS :__** ${safeFixed(theoriqueNote)}/10
> Piliers :  ${safeFixed(sections.theorique.piliers)}/2 
> Hiérarchie :  ${safeFixed(sections.theorique.hierarchie)}/3
> Protocole : ${safeFixed(sections.theorique.protocoles)}/1 
> Spécialités : ${safeFixed(sections.theorique.specialites)}/1
> Code radio :  ${safeFixed(sections.theorique.codesRadio)}/3 

**__Mise en situation : __** ${safeFixed(pratiqueNote)}/10
> Type de blessures :  ${safeFixed(sections.pratique.typeBlessure)}/2
> Savoir faire le rapport : ${safeFixed(sections.pratique.rapport)}/3
> Mise en situation : ${safeFixed(sections.pratique.mes)}/3
> Connaissance de l’hôpital : ${safeFixed(sections.pratique.connaissance)}/2

**__Total :__**  ${safeFixed(total)}/20

__**Conclusion :**__ ${prenom} ${nom} est **${isApte}** à passer EMT`;

    document.getElementById('discordTexte').textContent = texte;
}


const CUSTOM_QUESTIONS_KEY = "sams_prof_custom_questions_v1";
const defaultCustomQuestions = {
    codesRadio: [],
    typeBlessure: [],
    rapport: [],
    mes: [],
    connaissance: []
};

function getCustomQuestions() {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_QUESTIONS_KEY)) || defaultCustomQuestions;
    } catch {
        return defaultCustomQuestions;
    }
}
function saveCustomQuestions(obj) {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(obj));
}

function renderCustomQuestions() {
    // Ajoute les boutons d'import/export si pas déjà présents
    let container = document.getElementById('custom-question-controls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-question-controls';
        container.style.margin = '18px 0';
        container.style.display = 'flex';
        container.style.gap = '12px';
        container.innerHTML = `
            <button id="exportCustomQuestions" class="btn">📤 Exporter questions personnalisées</button>
            <button id="importCustomQuestions" class="btn">📥 Importer questions personnalisées</button>
            <input type="file" id="importCustomQuestionsFile" style="display:none;" accept=".json" />
        `;
        const mainContainer = document.querySelector('.main-container') || document.body;
        mainContainer.insertBefore(container, mainContainer.firstChild);
        document.getElementById('exportCustomQuestions').onclick = exportCustomQuestions;
        document.getElementById('importCustomQuestions').onclick = () => {
            document.getElementById('importCustomQuestionsFile').click();
        };
        document.getElementById('importCustomQuestionsFile').onchange = importCustomQuestions;
    }
    renderCustomBlock('codesRadio', 'codes-radio-block', 'theorique');
    renderCustomBlock('typeBlessure', 'type-blessure-block', 'pratique');
    renderCustomBlock('rapport', 'rapport-block', 'pratique');
    renderCustomBlock('mes', 'mes-block', 'pratique');
    renderCustomBlock('connaissance', 'connaissance-block', 'pratique');
}
function renderCustomBlock(key, blockId, className) {
    const data = getCustomQuestions();
    const block = document.getElementById(blockId);
    block.innerHTML = '';
    data[key].forEach((q, idx) => {
        const id = `${blockId}-q${idx}`;
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" data-points="${q.points}" class="${className}" data-part="${key}" /> ${q.label}`;
        // Remove button
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "adjust-btn";
        btn.style.marginLeft = "8px";
        btn.style.background = "#ef4444";
        btn.style.color = "#fff";
        btn.textContent = "✖";
        btn.title = "Supprimer";
        btn.onclick = () => { removeCustomQuestion(key, idx); };
        label.appendChild(btn);

        // Note input (remplace bonus/malus)
        const noteDiv = document.createElement('div');
        noteDiv.className = "adjust-control";
        noteDiv.style.marginLeft = "8px";
        const noteLabel = document.createElement('span');
        noteLabel.textContent = "Note :";
        noteLabel.style.marginRight = "4px";
        const noteInput = document.createElement('input');
        noteInput.type = "number";
        noteInput.step = "0.01";
        noteInput.min = "0";
        noteInput.max = "10";
        noteInput.value = q.points;
        noteInput.style.width = "70px";
        noteInput.style.padding = "8px 12px";
        noteInput.className = "adjust-value";
        noteInput.onchange = (e) => {
            q.points = parseFloat(noteInput.value) || 0;
            saveCustomQuestions(data);
            renderCustomQuestions();
        };
        noteDiv.appendChild(noteLabel);
        noteDiv.appendChild(noteInput);

        // Ajout du bonus/malus
        const bonusDiv = document.createElement('div');
        bonusDiv.className = "adjust-control";
        bonusDiv.style.marginLeft = "8px";
        const minusBtn = document.createElement('button');
        minusBtn.type = "button";
        minusBtn.className = "adjust-btn";
        minusBtn.textContent = "−";
        minusBtn.setAttribute("data-adjust", "-0.01");
        minusBtn.onclick = () => {
            q.bonus = (q.bonus || 0) - 0.01;
            saveCustomQuestions(data);
            renderCustomQuestions();
        };
        const valSpan = document.createElement('span');
        valSpan.className = "adjust-value";
        valSpan.textContent = q.bonus || 0;
        const plusBtn = document.createElement('button');
        plusBtn.type = "button";
        plusBtn.className = "adjust-btn";
        plusBtn.textContent = "+";
        plusBtn.setAttribute("data-adjust", "0.01");
        plusBtn.onclick = () => {
            q.bonus = (q.bonus || 0) + 0.01;
            saveCustomQuestions(data);
            renderCustomQuestions();
        };
        bonusDiv.appendChild(minusBtn);
        bonusDiv.appendChild(valSpan);
        bonusDiv.appendChild(plusBtn);

        label.appendChild(noteDiv);
        label.appendChild(bonusDiv);

        block.appendChild(label);
    });
}

function addCustomQuestion(key) {
    const data = getCustomQuestions();
    let inputId = "";
    let defaultPoints = 0.3;
    if (key === "codesRadio") { inputId = "new-codes-radio"; defaultPoints = 0.3; }
    if (key === "typeBlessure") { inputId = "new-type-blessure"; defaultPoints = 0.4; }
    if (key === "rapport") { inputId = "new-rapport"; defaultPoints = 0.25; }
    if (key === "mes") { inputId = "new-mes"; defaultPoints = 0.25; }
    if (key === "connaissance") { inputId = "new-connaissance"; defaultPoints = 0.25; }
    const input = document.getElementById(inputId);
    const value = input.value.trim();
    if (value) {
        data[key].push({ label: value, points: defaultPoints });
        saveCustomQuestions(data);
        renderCustomQuestions();
        input.value = '';
    }
}
function removeCustomQuestion(key, idx) {
    const data = getCustomQuestions();
    data[key].splice(idx, 1);
    saveCustomQuestions(data);
    renderCustomQuestions();
}

// Initial rendering
renderCustomQuestions();
fetch('changelog_prof.json')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data) && data.length > 0) {
            document.querySelector('.header span').textContent = data[0].version;
        }
    });

function exportCustomQuestions() {
    const data = getCustomQuestions();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "sams_questions_personnalisees.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importCustomQuestions(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            saveCustomQuestions(imported);
            renderCustomQuestions();
            alert("Questions personnalisées importées !");
        } catch (err) {
            alert("Erreur lors de l'importation du fichier : " + err.message);
        }
    };
    reader.readAsText(file);
}