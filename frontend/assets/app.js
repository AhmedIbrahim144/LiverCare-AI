let currentLang = localStorage.getItem('lang') || 'en';
let currentProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    setupNavigation();
    setupChat();
    setupProfile();
    setupTracking();
    setupLabs();
    loadDashboard();
});

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('langToggle').textContent = lang === 'en' ? 'AR | EN' : 'EN | AR';
    document.querySelectorAll('[data-en]').forEach(el => {
        const text = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (el.tagName === 'INPUT') {
            el.placeholder = lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('data-en-placeholder');
        } else {
            el.textContent = text;
        }
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        el.placeholder = lang === 'ar' ? el.getAttribute('data-ar-placeholder') : el.getAttribute('data-en-placeholder');
    });
}

function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'ar' : 'en');
}

function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    if (page === 'dashboard') loadDashboard();
    if (page === 'tracking') loadTracking();
}

async function loadDashboard() {
    try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        const info = document.getElementById('dashProfileInfo');
        if (data.profile) {
            currentProfile = data.profile;
            const p = data.profile;
            let html = '';
            if (p.name) html += `<p><strong>Name:</strong> ${p.name}</p>`;
            if (p.age) html += `<p><strong>Age:</strong> ${p.age}</p>`;
            if (p.weight) html += `<p><strong>Weight:</strong> ${p.weight} kg</p>`;
            if (p.bmi) html += `<p><strong>BMI:</strong> ${p.bmi}</p>`;
            if (p.activity_level) html += `<p><strong>Activity:</strong> ${p.activity_level}</p>`;
            info.innerHTML = html || '<p>No profile data yet.</p>';
        } else {
            info.innerHTML = currentLang === 'ar' ? '<p>لم يتم إعداد ملف شخصي بعد.</p>' : '<p>No profile set up yet.</p>';
        }
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('vectorStats').innerHTML = `
            <p><strong>${currentLang === 'ar' ? 'المستندات المفهرسة' : 'Indexed Vectors'}:</strong> ${data.vector_count}</p>
            <p><strong>${currentLang === 'ar' ? 'المجموعة' : 'Collection'}:</strong> ${data.collection}</p>
        `;
    } catch (e) {
        document.getElementById('vectorStats').innerHTML = '<p>Error loading stats</p>';
    }
}

function setupChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = currentLang === 'ar' ? btn.getAttribute('data-q-ar') : btn.getAttribute('data-q-en');
            input.value = q;
            sendMessage();
        });
    });
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    addMessage(msg, 'user');
    const loadingId = addLoading();
    try {
        const patientCtx = currentProfile ? {
            age: currentProfile.age,
            sex: currentProfile.sex,
            bmi: currentProfile.bmi,
            diabetes: currentProfile.diabetes,
            hypertension: currentProfile.hypertension,
            activity_level: currentProfile.activity_level,
        } : null;
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: msg, patient_context: patientCtx }),
        });
        const data = await res.json();
        removeLoading(loadingId);
        addAiMessage(data);
    } catch (e) {
        removeLoading(loadingId);
        addMessage(currentLang === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.', 'ai');
    }
}

function addMessage(text, type) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `message ${type === 'user' ? 'user-message' : 'ai-message'}`;
    div.innerHTML = `
        <div class="message-avatar">${type === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content"><p>${escapeHtml(text)}</p></div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addAiMessage(data) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message ai-message';
    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
        citationsHtml = '<div class="citations-box"><h4>' + (currentLang === 'ar' ? 'المصادر' : 'Sources') + ':</h4>';
        data.citations.forEach((c, i) => {
            citationsHtml += `<div class="citation-item"><span class="citation-num">[${i + 1}]</span> ${escapeHtml(c.document)} — Page ${c.page} (${c.relevance_score})</div>`;
        });
        citationsHtml += '</div>';
    }
    let safetyHtml = '';
    if (data.safety_notice) {
        safetyHtml = `<div class="safety-notice">${currentLang === 'ar' ? '⚠️ هذه المعلومات لأغراض تعليمية فقط. استشر طبيبك.' : '⚠️ This information is for educational purposes only. Consult your doctor.'}</div>`;
    }
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <p>${escapeHtml(data.answer)}</p>
            ${citationsHtml}
            ${safetyHtml}
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addLoading() {
    const container = document.getElementById('chatMessages');
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message ai-message';
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content loading-indicator">
            <span>${currentLang === 'ar' ? 'جاري التفكير' : 'Thinking'}</span>
            <span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function setupProfile() {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const profile = {
            name: document.getElementById('pName').value,
            age: parseInt(document.getElementById('pAge').value) || null,
            sex: document.getElementById('pSex').value || null,
            weight: parseFloat(document.getElementById('pWeight').value) || null,
            height: parseFloat(document.getElementById('pHeight').value) || null,
            diabetes: document.getElementById('pDiabetes').value === 'true',
            hypertension: document.getElementById('pHypertension').value === 'true',
            activity_level: document.getElementById('pActivity').value || null,
        };
        if (currentProfile && currentProfile.id) profile.id = currentProfile.id;
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });
            const data = await res.json();
            currentProfile = data.profile;
            alert(currentLang === 'ar' ? 'تم حفظ الملف الشخصي' : 'Profile saved successfully');
        } catch (e) {
            alert(currentLang === 'ar' ? 'حدث خطأ' : 'An error occurred');
        }
    });
    loadProfile();
}

async function loadProfile() {
    try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.profile) {
            currentProfile = data.profile;
            const p = data.profile;
            if (p.name) document.getElementById('pName').value = p.name;
            if (p.age) document.getElementById('pAge').value = p.age;
            if (p.sex) document.getElementById('pSex').value = p.sex;
            if (p.weight) document.getElementById('pWeight').value = p.weight;
            if (p.height) document.getElementById('pHeight').value = p.height;
            if (p.bmi) document.getElementById('pBMI').value = p.bmi;
            if (p.diabetes !== undefined) document.getElementById('pDiabetes').value = p.diabetes.toString();
            if (p.hypertension !== undefined) document.getElementById('pHypertension').value = p.hypertension.toString();
            if (p.activity_level) document.getElementById('pActivity').value = p.activity_level;
        }
    } catch (e) {}
    document.getElementById('pWeight').addEventListener('input', calculateBMI);
    document.getElementById('pHeight').addEventListener('input', calculateBMI);
}

function calculateBMI() {
    const w = parseFloat(document.getElementById('pWeight').value);
    const h = parseFloat(document.getElementById('pHeight').value);
    if (w > 0 && h > 0) {
        document.getElementById('pBMI').value = (w / (h * h)).toFixed(1);
    }
}

function setupTracking() {
    document.getElementById('trackingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const entry = {
            profile_id: currentProfile ? currentProfile.id : null,
            date: document.getElementById('tDate').value,
            weight: parseFloat(document.getElementById('tWeight').value) || null,
            activity: document.getElementById('tActivity').value || null,
            notes: document.getElementById('tNotes').value || null,
        };
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            });
            document.getElementById('trackingForm').reset();
            loadTracking();
        } catch (e) {
            alert(currentLang === 'ar' ? 'حدث خطأ' : 'An error occurred');
        }
    });
}

async function loadTracking() {
    try {
        const res = await fetch('/api/track');
        const data = await res.json();
        const entries = data.entries || [];
        const container = document.getElementById('trackingEntries');
        if (entries.length === 0) {
            container.innerHTML = currentLang === 'ar' ? '<p>لا توجد سجلات بعد.</p>' : '<p>No entries yet.</p>';
            return;
        }
        let html = '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
        html += `<tr style="background:var(--primary-light);"><th style="padding:0.5rem;text-align:left;">${currentLang === 'ar' ? 'التاريخ' : 'Date'}</th><th style="padding:0.5rem;text-align:left;">${currentLang === 'ar' ? 'الوزن' : 'Weight'}</th><th style="padding:0.5rem;text-align:left;">${currentLang === 'ar' ? 'النشاط' : 'Activity'}</th><th style="padding:0.5rem;text-align:left;">${currentLang === 'ar' ? 'ملاحظات' : 'Notes'}</th></tr>`;
        entries.reverse().forEach(e => {
            html += `<tr style="border-bottom:1px solid var(--border);"><td style="padding:0.4rem;">${e.date || '-'}</td><td style="padding:0.4rem;">${e.weight || '-'}</td><td style="padding:0.4rem;">${e.activity || '-'}</td><td style="padding:0.4rem;">${e.notes || '-'}</td></tr>`;
        });
        html += '</table>';
        container.innerHTML = html;
        drawWeightChart(entries);
    } catch (e) {}
}

function drawWeightChart(entries) {
    const canvas = document.getElementById('weightChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const weights = entries.filter(e => e.weight).map(e => ({ date: e.date, weight: e.weight }));
    if (weights.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(currentLang === 'ar' ? 'يجب إدخال سجلين على الأقل للرسم' : 'Need at least 2 entries to draw chart', 20, 120);
        return;
    }
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;
    const minW = Math.min(...weights.map(x => x.weight)) - 2;
    const maxW = Math.max(...weights.map(x => x.weight)) + 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (h / 4) * i;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + w, y); ctx.stroke();
        ctx.fillStyle = '#64748b'; ctx.font = '11px sans-serif';
        ctx.fillText((maxW - ((maxW - minW) / 4) * i).toFixed(1), 5, y + 4);
    }
    ctx.strokeStyle = '#0d9488'; ctx.lineWidth = 2.5; ctx.beginPath();
    weights.forEach((p, i) => {
        const x = padding.left + (w / (weights.length - 1)) * i;
        const y = padding.top + h - ((p.weight - minW) / (maxW - minW)) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = '#0d9488';
    weights.forEach((p, i) => {
        const x = padding.left + (w / (weights.length - 1)) * i;
        const y = padding.top + h - ((p.weight - minW) / (maxW - minW)) * h;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    });
}

function setupLabs() {
    document.getElementById('labForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const lab = document.getElementById('labSelect').value;
        const val = document.getElementById('labValue').value;
        if (!val) return;
        const query = currentLang === 'ar'
            ? `اشرح لي تحليل ${lab} وقيمتي ${val}`
            : `Explain the lab test ${lab} with my value ${val}`;
        const resultDiv = document.getElementById('labResult');
        resultDiv.className = 'lab-result visible';
        resultDiv.innerHTML = currentLang === 'ar' ? 'جاري التحليل...' : 'Analyzing...';
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            let html = `<p>${escapeHtml(data.answer)}</p>`;
            if (data.citations && data.citations.length > 0) {
                html += '<div class="citations-box" style="margin-top:0.75rem;"><h4>' + (currentLang === 'ar' ? 'المصادر' : 'Sources') + ':</h4>';
                data.citations.forEach((c, i) => {
                    html += `<div class="citation-item"><span class="citation-num">[${i + 1}]</span> ${escapeHtml(c.document)} — Page ${c.page}</div>`;
                });
                html += '</div>';
            }
            resultDiv.innerHTML = html;
        } catch (e) {
            resultDiv.innerHTML = currentLang === 'ar' ? 'حدث خطأ أثناء التحليل.' : 'An error occurred during analysis.';
        }
    });
}
