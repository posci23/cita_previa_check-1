(() => {
  const DEFAULTS = {
    enabled: true,
    provincia: 'Barcelona',
    oficina: 'RAMBLA GUIPUSCOA',
    tramite: 'RECOGIDA TARJETA',
    nie: 'Y8865923N',
    nombre: 'YEVGENIY KONDRATOV',
  };

  // The flow spans several page loads in the same tab; sessionStorage keeps
  // later pages from acting unless the run was started on the first page.
  const FLOW_KEY = 'citaAutofillActive';
  const START_PATH = '/acOpcDirect';

  const normalize = (s) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();

  const words = (s) => normalize(s).split(' ').filter(Boolean);

  const textMatches = (text, query) => {
    const t = normalize(text);
    return words(query).every((w) => t.includes(w));
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = async (finder, timeoutMs = 15000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = finder();
      if (el) return el;
      await sleep(200);
    }
    return null;
  };

  const log = (...args) => console.log('[Cita Autofill]', ...args);

  const banner = (msg, isError = false) => {
    let el = document.getElementById('cita-autofill-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cita-autofill-banner';
      el.style.cssText =
        'position:fixed;top:10px;right:10px;z-index:2147483647;padding:10px 14px;' +
        'border-radius:8px;font:14px/1.3 sans-serif;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);' +
        'max-width:320px;';
      document.documentElement.appendChild(el);
    }
    el.style.background = isError ? '#c62828' : '#2e7d32';
    el.textContent = 'Cita Autofill: ' + msg;
    log(msg);
  };

  const findOption = (select, query) =>
    Array.from(select.options).find((o) => o.value && textMatches(o.textContent, query));

  const selectedMatches = (select, query) => {
    const opt = select.options[select.selectedIndex];
    return !!(opt && opt.value && textMatches(opt.textContent, query));
  };

  const chooseOption = (select, option) => {
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const setInput = (input, value) => {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  const click = async (selector) => {
    const btn = await waitFor(() => document.querySelector(selector), 8000);
    if (!btn) return false;
    await sleep(400);
    btn.click();
    return true;
  };

  const endFlow = () => sessionStorage.removeItem(FLOW_KEY);

  async function stepProvincia(cfg) {
    const select = document.querySelector('#form');
    const option = findOption(select, cfg.provincia);
    if (!option) {
      banner(`province "${cfg.provincia}" not found`, true);
      endFlow();
      return;
    }
    chooseOption(select, option);
    banner(`selected ${option.textContent.trim()}`);
    await click('#btnAceptar');
  }

  async function stepOficinaTramite(cfg) {
    const sede = document.querySelector('#sede, #idSede, select[name="sede"]');
    if (sede && !selectedMatches(sede, cfg.oficina)) {
      const option = findOption(sede, cfg.oficina);
      if (!option) {
        banner(`office "${cfg.oficina}" not found`, true);
        endFlow();
        return;
      }
      chooseOption(sede, option);
      banner(`selected office ${option.textContent.trim()}`);
      // Changing the office can reload the page; if so this script restarts
      // and finds the office already selected.
      await sleep(1000);
    }

    const findTramite = () => {
      for (const sel of document.querySelectorAll('select[name^="tramiteGrupo"]')) {
        const opt = findOption(sel, cfg.tramite);
        if (opt) return { sel, opt };
      }
      return null;
    };

    const found = await waitFor(findTramite, 10000);
    if (!found) {
      banner(`procedure "${cfg.tramite}" not found`, true);
      endFlow();
      return;
    }
    chooseOption(found.sel, found.opt);
    banner(`selected ${found.opt.textContent.trim()}`);
    await sleep(500);
    await click('#btnAceptar');
  }

  async function stepEntrar() {
    banner('clicking Entrar');
    await click('#btnEntrar');
  }

  async function stepDatos(cfg) {
    const nieRadio = document.querySelector('#rdbTipoDocNie');
    if (nieRadio && !nieRadio.checked) {
      nieRadio.click();
      await sleep(300);
    }
    setInput(document.querySelector('#txtIdCitado'), cfg.nie);
    await sleep(300);
    const nombre = document.querySelector('#txtDesCitado');
    if (nombre) setInput(nombre, cfg.nombre);
    await sleep(300);

    const pais = document.querySelector('#txtPaisNac');
    if (pais && !pais.value) {
      banner('filled NIE and name. Please choose the country, then click Aceptar.');
      endFlow();
      return;
    }

    endFlow();
    banner('filled NIE and name, clicking Aceptar. Over to you.');
    await click('#btnEnviar');
  }

  async function run() {
    const cfg = await new Promise((r) => chrome.storage.sync.get(DEFAULTS, r));
    if (!cfg.enabled) return;

    if (location.pathname.endsWith(START_PATH) && document.querySelector('#form')) {
      sessionStorage.setItem(FLOW_KEY, '1');
      await stepProvincia(cfg);
      return;
    }

    if (!sessionStorage.getItem(FLOW_KEY)) return;

    if (document.querySelector('#txtIdCitado')) return stepDatos(cfg);
    if (document.querySelector('#btnEntrar')) return stepEntrar();
    if (document.querySelector('select[name^="tramiteGrupo"], #sede')) return stepOficinaTramite(cfg);
    if (document.querySelector('#form')) return stepProvincia(cfg);
  }

  run().catch((err) => {
    banner('error: ' + err.message, true);
    endFlow();
  });
})();
