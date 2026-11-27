const DEFAULTS = {
  enabled: true,
  provincia: 'Barcelona',
  oficina: 'RAMBLA GUIPUSCOA',
  tramite: 'RECOGIDA TARJETA',
  nie: 'Y8865923N',
  nombre: 'YEVGENIY KONDRATOV',
};
const START_URL = 'https://icp.administracionelectronica.gob.es/icpplustieb/acOpcDirect';
const TEXT_FIELDS = ['provincia', 'oficina', 'tramite', 'nie', 'nombre'];

chrome.storage.sync.get(DEFAULTS, (cfg) => {
  document.getElementById('enabled').checked = cfg.enabled;
  for (const f of TEXT_FIELDS) document.getElementById(f).value = cfg[f];
});

document.getElementById('save').addEventListener('click', () => {
  const cfg = { enabled: document.getElementById('enabled').checked };
  for (const f of TEXT_FIELDS) cfg[f] = document.getElementById(f).value.trim();
  chrome.storage.sync.set(cfg, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved';
    setTimeout(() => (status.textContent = ''), 1500);
  });
});

document.getElementById('open').addEventListener('click', () => {
  chrome.tabs.create({ url: START_URL });
});
