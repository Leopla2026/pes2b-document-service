document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy || '');
      const original = button.textContent;
      button.textContent = 'Copiado';
      setTimeout(() => { button.textContent = original; }, 1500);
    } catch (error) {
      console.error('Não foi possível copiar.', error);
    }
  });
});

async function loadApiStatus() {
  const statusElement = document.querySelector('[data-api-status]');
  const versionElement = document.querySelector('[data-api-version]');
  const responseTimeElement = document.querySelector('[data-api-response-time]');
  if (!statusElement) return;

  const startedAt = performance.now();
  statusElement.classList.remove('status-up', 'status-down');

  try {
    const statusResponse = await fetch('/api-status', { cache: 'no-store' });
    if (!statusResponse.ok) throw new Error(`Status HTTP ${statusResponse.status}`);
    const status = await statusResponse.json();
    const elapsed = Math.round(performance.now() - startedAt);

    statusElement.textContent = status.data?.status ?? status.status ?? 'UP';
    statusElement.classList.add('status-up');
    if (responseTimeElement) responseTimeElement.textContent = `${elapsed} ms`;

    try {
      const infoResponse = await fetch('/api-info', { cache: 'no-store' });
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        const version = info.application?.version ?? info.build?.version ?? info.version ?? info.data?.version ?? '2.0.0';
        if (versionElement) versionElement.textContent = version;
      }
    } catch (error) {
      console.warn('Não foi possível consultar a versão.', error);
    }
  } catch (error) {
    statusElement.textContent = 'INDISPONÍVEL';
    statusElement.classList.add('status-down');
    if (responseTimeElement) responseTimeElement.textContent = '-';
    console.error('Não foi possível consultar o status da API.', error);
  }
}

loadApiStatus();
setInterval(loadApiStatus, 60000);
