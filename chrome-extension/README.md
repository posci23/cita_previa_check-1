# Cita Previa Autofill (Chrome extension)

Automates the first steps of the cita previa flow at
<https://icp.administracionelectronica.gob.es/icpplustieb/acOpcDirect>:

1. Province: **Barcelona**, then Aceptar
2. Office: **Rambla Guipuscoa**; procedure: **Recogida de tarjeta (TIE)**, then Aceptar
3. Info page: Entrar
4. NIE **Y8865923N**, name **YEVGENIY KONDRATOV**, then Aceptar

After that it stops and you continue by hand.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `chrome-extension` folder

## Use

Open the page above (or click **Open page** in the extension popup). The
steps run automatically and a green banner in the top-right corner shows
progress; a red banner means something wasn't found.

The automation only starts from the `acOpcDirect` page, so browsing other
pages of the site is unaffected. Use the popup to disable it or change the
office, procedure, NIE, or name. Office and procedure are matched by words
(accents and case are ignored), so `RAMBLA GUIPUSCOA` matches
`CNP RAMBLA GUIPUSCOA 74, RAMBLA GUIPUSCOA, 74`.
