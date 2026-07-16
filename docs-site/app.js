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

function valueFromPaths(object, paths) {
  for (const path of paths) {
    const value = path.split('.').reduce((current, key) => current?.[key], object);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

async function loadApiStatus() {
  const statusElement = document.querySelector('[data-api-status]');
  const versionElement = document.querySelector('[data-api-version]');
  const responseTimeElement = document.querySelector('[data-api-response-time]');
  const checkedAtElement = document.querySelector('[data-api-checked-at]');
  if (!statusElement) return;

  statusElement.classList.remove('status-up', 'status-down');
  statusElement.textContent = 'Consultando...';
  const startedAt = performance.now();

  try {
    const statusResponse = await fetch('/api-status', { cache: 'no-store' });
    const elapsed = Math.round(performance.now() - startedAt);
    if (!statusResponse.ok) throw new Error(`Status HTTP ${statusResponse.status}`);
    const statusBody = await statusResponse.json();
    const status = valueFromPaths(statusBody, ['data.status', 'status', 'health.status']) || 'UP';
    statusElement.textContent = String(status).toUpperCase();
    statusElement.classList.add(String(status).toUpperCase() === 'UP' ? 'status-up' : 'status-down');
    if (responseTimeElement) responseTimeElement.textContent = `${elapsed} ms`;

    try {
      const infoResponse = await fetch('/api-info', { cache: 'no-store' });
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        const version = valueFromPaths(info, ['version', 'data.version', 'application.version', 'app.version', 'build.version']);
        if (versionElement && version) versionElement.textContent = version;
      }
    } catch (error) {
      console.warn('Não foi possível consultar a versão.', error);
    }
  } catch (error) {
    statusElement.textContent = 'INDISPONÍVEL';
    statusElement.classList.add('status-down');
    if (responseTimeElement) responseTimeElement.textContent = '-';
    console.error('Não foi possível consultar o status da API.', error);
  } finally {
    if (checkedAtElement) checkedAtElement.textContent = new Date().toLocaleString('pt-BR');
  }
}

loadApiStatus();
setInterval(loadApiStatus, 60000);
