let lastHtml = '';

document.getElementById('generateBtn').addEventListener('click', async () => {
  const closingMonth = document.getElementById('closingMonth').value;
  const res = await window.api.generateDashboard({ closingMonth });
  if (res.ok) {
    lastHtml = res.html;
    document.getElementById('preview').srcdoc = res.html;
    document.getElementById('status').textContent = `Generated: ${res.file}`;
  }
});

document.getElementById('sendBtn').addEventListener('click', async () => {
  if (!lastHtml) return alert('먼저 대시보드를 생성하세요.');
  const result = await window.api.sendEmail({
    to: ['exec@example.com'],
    subject: '[결산] Monthly Dashboard',
    html: lastHtml,
    requireApproval: true
  });
  alert(JSON.stringify(result));
});
