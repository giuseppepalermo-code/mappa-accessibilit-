// ===============================
// MAPPA DELL'ACCESSIBILITÀ
// ===============================

const SUPABASE_URL = "https://fawxdgdlmhuadpxjjpac.supabase.co";
const SUPABASE_KEY = "sb_publishable_-BATje0RS7UM8GMtRiQjkQ_vujpg8ho";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------------------
// UTILITÀ TESTO E NORMALIZZAZIONE
// -------------------------------

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeDisplayText(value) {
  const cleaned = normalizeText(value)
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function cleanCategoriaValue(value) {
  const v = normalizeDisplayText(value).toLowerCase();

  if (!v) return "";

  if (v.includes("parcheggio")) return "Parcheggio disabili";
  if (v.includes("rampa")) return "Rampa";
  if (v.includes("farmacia")) return "Farmacia";
  if (v.includes("ambulatorio")) return "Ambulatorio medico";
  if (v.includes("medico")) return "Ambulatorio medico";
  if (v.includes("negozio")) return "Negozio";
  if (v.includes("scuola")) return "Scuola";
  if (v.includes("comune")) return "Comune";
  if (v.includes("barriera")) return "Barriera architettonica";
  if (v.includes("percorso")) return "Percorso pedonale";
  if (v.includes("ingresso")) return "Ingresso edificio";
  if (v.includes("spazio")) return "Spazio pubblico";
  if (v.includes("ufficio")) return "Ufficio pubblico";
  if (v.includes("ospedale")) return "Ospedale";
  if (v.includes("ristorante")) return "Ristorante";
  if (v.includes("bar")) return "Bar";
  if (v.includes("supermercato")) return "Supermercato";
  if (v.includes("altro")) return "Altro";

  return normalizeDisplayText(value);
}

function cleanCategoriaValue(value) {
  const v = normalizeDisplayText(value).toLowerCase();

  if (!v) return "";

  if (v.includes("parcheggio")) return "Parcheggio disabili";
  if (v.includes("rampa")) return "Rampa";
  if (v.includes("farmacia")) return "Farmacia";
  if (v.includes("ambulatorio")) return "Ambulatorio medico";
  if (v.includes("medico")) return "Ambulatorio medico";
  if (v.includes("negozio")) return "Negozio";
  if (v.includes("scuola")) return "Scuola";
  if (v.includes("comune")) return "Comune";
  if (v.includes("barriera")) return "Barriera architettonica";
  if (v.includes("percorso")) return "Percorso pedonale";
  if (v.includes("ingresso")) return "Ingresso edificio";
  if (v.includes("spazio")) return "Spazio pubblico";
  if (v.includes("ufficio")) return "Ufficio pubblico";
  if (v.includes("ospedale")) return "Ospedale";
  if (v.includes("ristorante")) return "Ristorante";
  if (v.includes("bar")) return "Bar";
  if (v.includes("supermercato")) return "Supermercato";
  if (v.includes("altro")) return "Altro";

  return normalizeDisplayText(value);
}

function cleanLuogoValue(value) {
  const cleaned = normalizeDisplayText(value);

  if (!cleaned) return "";
  if (cleaned.length < 3) return "";
  if (/^[0-9\\s\\-]+$/.test(cleaned)) return "";

  const invalidWords = [
    "undefined",
    "null",
    "nan",
    "test",
    "prova"
  ];

  const lower = cleaned.toLowerCase();

  if (invalidWords.some((word) => lower.includes(word))) {
    return "";
  }

  return cleaned;
}

function isValidStatus(status) {
  return ["rosso", "arancione", "verde"].includes(normalizeStatus(status));
}

function getStatusLabel(status) {
  const s = normalizeStatus(status);
  if (s === "rosso") return "Non accessibile";
  if (s === "arancione") return "Parzialmente accessibile";
  if (s === "verde") return "Accessibile";
  return "Stato non valido";
}

function getColor(status) {
  const s = normalizeStatus(status);
  if (s === "rosso") return "#d62828";
  if (s === "arancione") return "#f77f00";
  if (s === "verde") return "#2a9d8f";
  return "#6b7280";
}

function workflowLabel(value) {
  const v = normalizeText(value).toLowerCase();
  if (v === "nuova") return "Nuova";
  if (v === "presa in carico") return "Presa in carico";
  if (v === "chiusa") return "Chiusa";
  return "Nuova";
}

function workflowBadgeClass(value) {
  const v = normalizeText(value).toLowerCase();
  if (v === "chiusa") return "wf-badge wf-green";
  if (v === "presa in carico") return "wf-badge wf-orange";
  return "wf-badge wf-blue";
}

function fotoPublicUrl(nomeFile) {
  if (!nomeFile) return "";
  const { data } = supabaseClient.storage.from("foto").getPublicUrl(nomeFile);
  return data.publicUrl;
}

// -------------------------------
// MAPPING DB <-> APP
// -------------------------------

function dbRowToPoint(row) {
  const latValue = Number(row.lat ?? row.Lat);
  const lngValue = Number(row.lng ?? row.Lng ?? row.log ?? row.Log);

  return {
    id: row.id,
    codice: row.codice || row.Codice || "",
    title: row.titolo || row.Titolo || "",
    comune: cleanComuneValue(row.comune || row.Comune || ""),
    categoria: cleanCategoriaValue(row.categoria || row.Categoria || "Altro"),
    status: normalizeStatus(row.stato || row.Stato || ""),
    workflow: normalizeText(row.statosegnalazione || row.StatoSegnalazione || "nuova").toLowerCase(),
    visibilita: normalizeText(row.visibilita || row.Visibilita || "pubblica").toLowerCase(),
    statoArchivio: normalizeText(row.stato_archivio || row.StatoArchivio || "attiva").toLowerCase(),
    luogo: cleanLuogoValue(row.luogo || row.Luogo || ""),
    description: normalizeText(row.descrizione || row.Descrizione || ""),
    nomeSegnalante: normalizeDisplayText(row.nomesegnalante || row.NomeSegnalante || ""),
    contattoSegnalante: normalizeText(row.contattosegnalante || row.ContattoSegnalante || ""),
    gpsLat: row.gpslat ?? row.GpsLat ?? null,
    gpsLng: row.gpslng ?? row.GpsLng ?? null,
    foto1: row.foto1 || null,
    foto2: row.foto2 || null,
    foto3: row.foto3 || null,
    coords: [latValue, lngValue]
  };
}

function pointToDbRow(point) {
  return {
    codice: point.codice,
    Titolo: point.title,
    Comune: point.comune,
    Categoria: point.categoria,
    Luogo: point.luogo,
    Descrizione: point.description,
    Stato: point.status,
    statosegnalazione: point.workflow,
    nomesegnalante: point.nomeSegnalante,
    contattosegnalante: point.contattoSegnalante,
    gpslat: point.gpsLat,
    gpslng: point.gpsLng,
    Lat: point.coords[0],
    Log: point.coords[1],
    foto1: point.foto1 || null,
    foto2: point.foto2 || null,
    foto3: point.foto3 || null,
    visibilita: point.visibilita || "pubblica",
    stato_archivio: point.statoArchivio || "attiva"
  };
}

// -------------------------------
// CODICI
// -------------------------------

function comunePrefix(comune) {
  const c = normalizeText(comune).toLowerCase();
  if (c === "san cataldo") return "SC";
  if (c === "caltanissetta") return "CL";
  return "PT";
}

function generateNextCode(comune, existingPoints, currentId = null) {
  const prefix = comunePrefix(comune);
  const sameComune = existingPoints.filter(
    (p) => p.id !== currentId && comunePrefix(p.comune) === prefix
  );

  let maxNum = 0;
  sameComune.forEach((p) => {
    const match = String(p.codice || "").match(/-(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      if (n > maxNum) maxNum = n;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, "0");
  return `${prefix}-${nextNum}`;
}

// -------------------------------
// MAPPA
// -------------------------------

const map = L.map("map", {
  closePopupOnClick: true
}).setView([37.4905, 14.0626], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function refreshMapSize() {
  setTimeout(() => map.invalidateSize(), 250);
}

function findNearestPointWithinTolerance(latlng, maxPixelDistance = 26) {
  if (!latlng || !points.length) return null;

  const tappedPoint = map.latLngToContainerPoint(latlng);
  let nearest = null;
  let minDistance = Infinity;

  points.forEach((point) => {
    if (!Array.isArray(point.coords) || point.coords.some((v) => Number.isNaN(v))) return;

    const pointLatLng = L.latLng(point.coords[0], point.coords[1]);
    const pointPixel = map.latLngToContainerPoint(pointLatLng);
    const distance = tappedPoint.distanceTo(pointPixel);

    if (distance <= maxPixelDistance && distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  });

  return nearest;
}

// -------------------------------
// STATO APP
// -------------------------------

const markersLayer = L.layerGroup().addTo(map);
let userMarker = null;
let points = [];
let selectedCoordsValue = null;
let editingId = null;
let gpsPhoneCoords = null;

// -------------------------------
// ELEMENTI DOM
// -------------------------------

const listaSegnalazioni = document.getElementById("listaSegnalazioni");
const toggleSegnalazioni = document.getElementById("toggleSegnalazioni");
const contenitoreSegnalazioni = document.getElementById("contenitoreSegnalazioni");
const toggleNuovoPunto = document.getElementById("toggleNuovoPunto");
const contenitoreNuovoPunto = document.getElementById("contenitoreNuovoPunto");
const btnApriForm = document.getElementById("btnApriForm");

const searchText = document.getElementById("searchText");
const filterComune = document.getElementById("filterComune");
const filterStatus = document.getElementById("filterStatus");
const filterWorkflow = document.getElementById("filterWorkflow");
const filterVisibilita = document.getElementById("filterVisibilita");
const filterArchivio = document.getElementById("filterArchivio");

const countRosso = document.getElementById("countRosso");
const countArancione = document.getElementById("countArancione");
const countVerde = document.getElementById("countVerde");
const countTotale = document.getElementById("countTotale");

const btnLocate = document.getElementById("btnLocate");
const btnLegend = document.getElementById("btnLegend");
const btnLegendMobile = document.getElementById("btnLegendMobile");
const btnCloseLegend = document.getElementById("btnCloseLegend");
const legendModal = document.getElementById("legendModal");

const formModal = document.getElementById("formModal");
const formModalTitle = document.getElementById("formModalTitle");
const btnCloseFormModal = document.getElementById("btnCloseFormModal");

const selectedCoords = document.getElementById("selectedCoords");
const modalSelectedCoords = document.getElementById("modalSelectedCoords");

const formSegnalazione = document.getElementById("formSegnalazione");
const inputCodice = document.getElementById("inputCodice");
const inputTitolo = document.getElementById("inputTitolo");
const inputComune = document.getElementById("inputComune");
const inputCategoria = document.getElementById("inputCategoria");
const inputLuogo = document.getElementById("inputLuogo");
const inputDescrizione = document.getElementById("inputDescrizione");
const inputStatus = document.getElementById("inputStatus");
const inputWorkflow = document.getElementById("inputWorkflow");
const inputNomeSegnalante = document.getElementById("inputNomeSegnalante");
const inputContattoSegnalante = document.getElementById("inputContattoSegnalante");

// nuovi campi foto pubblici
const inputFoto1Camera = document.getElementById("inputFoto1Camera");
const inputFoto1Gallery = document.getElementById("inputFoto1Gallery");
const inputFoto2Camera = document.getElementById("inputFoto2Camera");
const inputFoto2Gallery = document.getElementById("inputFoto2Gallery");
const inputFoto3Camera = document.getElementById("inputFoto3Camera");
const inputFoto3Gallery = document.getElementById("inputFoto3Gallery");

const btnResetSegnalazione = document.getElementById("btnResetSegnalazione");
const btnGpsPhone = document.getElementById("btnGpsPhone");
const gpsStatus = document.getElementById("gpsStatus");

const suggestionsComune = document.getElementById("suggestionsComune");
const suggestionsCategoria = document.getElementById("suggestionsCategoria");
const suggestionsLuogo = document.getElementById("suggestionsLuogo");

// menu filtri desktop/mobile
const btnResetFilters = document.getElementById("btnResetFilters");
const filterChips = document.querySelectorAll(".filter-chip[data-target]");
const filterDropdowns = document.querySelectorAll(".filter-dropdown");

const btnToggleMobileFilters = document.getElementById("btnToggleMobileFilters");
const btnCloseMobileFilters = document.getElementById("btnCloseMobileFilters");
const mobileFiltersPanel = document.getElementById("mobileFiltersPanel");
const btnApplyMobileFilters = document.getElementById("btnApplyMobileFilters");
const btnResetMobileFilters = document.getElementById("btnResetMobileFilters");

const searchTextMobileMirror = document.getElementById("searchTextMobileMirror");
const filterComuneMobileMirror = document.getElementById("filterComuneMobileMirror");
const filterStatusMobileMirror = document.getElementById("filterStatusMobileMirror");
const filterWorkflowMobileMirror = document.getElementById("filterWorkflowMobileMirror");
const filterVisibilitaMobileMirror = document.getElementById("filterVisibilitaMobileMirror");
const filterArchivioMobileMirror = document.getElementById("filterArchivioMobileMirror");

// -------------------------------
// FOTO: GESTIONE CAMERA / GALLERIA
// -------------------------------

function clearOtherFileInput(activeInput, otherInput) {
  if (!activeInput || !otherInput) return;

  activeInput.addEventListener("change", () => {
    if (activeInput.files && activeInput.files.length > 0) {
      otherInput.value = "";
    }
  });
}

function getSelectedFile(primaryInput, secondaryInput) {
  if (primaryInput?.files?.length > 0) return primaryInput.files[0];
  if (secondaryInput?.files?.length > 0) return secondaryInput.files[0];
  return null;
}

function resetPhotoInputs() {
  [
    inputFoto1Camera,
    inputFoto1Gallery,
    inputFoto2Camera,
    inputFoto2Gallery,
    inputFoto3Camera,
    inputFoto3Gallery
  ].forEach((input) => {
    if (input) input.value = "";
  });
}

clearOtherFileInput(inputFoto1Camera, inputFoto1Gallery);
clearOtherFileInput(inputFoto1Gallery, inputFoto1Camera);
clearOtherFileInput(inputFoto2Camera, inputFoto2Gallery);
clearOtherFileInput(inputFoto2Gallery, inputFoto2Camera);
clearOtherFileInput(inputFoto3Camera, inputFoto3Gallery);
clearOtherFileInput(inputFoto3Gallery, inputFoto3Camera);

// -------------------------------
// AUTOCOMPLETE E SUGGERIMENTI
// -------------------------------

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
}

function getSuggestionValues(type) {
  if (type === "comuni") {
    const comuniPuliti = points
      .map((p) => cleanComuneValue(p.comune))
      .filter(Boolean);

    return uniqueSorted([
      "San Cataldo",
      "Caltanissetta",
      ...comuniPuliti
    ]);
  }

  if (type === "categorie") {
    const categoriePulite = points
      .map((p) => cleanCategoriaValue(p.categoria))
      .filter(Boolean);

    return uniqueSorted([
      "Barriera architettonica",
      "Parcheggio disabili",
      "Rampa",
      "Ingresso edificio",
      "Percorso pedonale",
      "Farmacia",
      "Ambulatorio medico",
      "Negozio",
      "Scuola",
      "Comune",
      "Ufficio pubblico",
      "Ospedale",
      "Ristorante",
      "Bar",
      "Supermercato",
      "Spazio pubblico",
      "Altro",
      ...categoriePulite
    ]);
  }

  if (type === "luoghi") {
    const luoghiPuliti = points
      .map((p) => cleanLuogoValue(p.luogo))
      .filter(Boolean);

    return uniqueSorted(luoghiPuliti);
  }

  return [];
}
function filterSuggestionValues(values, text) {
  const t = normalizeText(text).toLowerCase();

  if (!t) {
    return values.slice(0, 12);
  }

  const starts = values.filter((v) =>
    v.toLowerCase().startsWith(t)
  );

  const includes = values.filter(
    (v) =>
      !v.toLowerCase().startsWith(t) &&
      v.toLowerCase().includes(t)
  );

  return [...starts, ...includes].slice(0, 12);
}
function hideSuggestions(box) {
  if (!box) return;
  box.classList.add("hidden");
  box.innerHTML = "";
}

function renderSuggestions(box, values, onSelect) {
  if (!box) return;

  box.innerHTML = "";

  if (!values.length) {
    hideSuggestions(box);
    return;
  }

  values.forEach((value) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = value;

    item.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      onSelect(value);
    });

    box.appendChild(item);
  });

  box.classList.remove("hidden");
}

function attachAutocomplete(inputEl, boxEl, type) {
  if (!inputEl || !boxEl) return;

  const update = () => {
    const allValues = getSuggestionValues(type);
    const filtered = filterSuggestionValues(allValues, inputEl.value);
    renderSuggestions(boxEl, filtered, (selectedValue) => {
      inputEl.value = selectedValue;
      hideSuggestions(boxEl);

      if (inputEl === inputComune && !editingId) {
        inputCodice.value = generateNextCode(selectedValue, points);
      }

      inputEl.focus();
    });
  };

  inputEl.addEventListener("focus", update);
  inputEl.addEventListener("input", update);
  inputEl.addEventListener("blur", () => {
    setTimeout(() => hideSuggestions(boxEl), 180);
  });
}

// -------------------------------
// FILTRI E MENU
// -------------------------------

function closeAllDesktopDropdowns() {
  filterDropdowns.forEach((drop) => drop.classList.add("hidden"));
}

function toggleDesktopDropdown(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const isHidden = target.classList.contains("hidden");
  closeAllDesktopDropdowns();
  if (isHidden) target.classList.remove("hidden");
}

function syncDesktopToMobileMirrors() {
  if (searchTextMobileMirror) searchTextMobileMirror.value = searchText?.value || "";
  if (filterComuneMobileMirror) filterComuneMobileMirror.value = filterComune?.value || "tutti";
  if (filterStatusMobileMirror) filterStatusMobileMirror.value = filterStatus?.value || "tutti";
  if (filterWorkflowMobileMirror) filterWorkflowMobileMirror.value = filterWorkflow?.value || "tutti";
  if (filterVisibilitaMobileMirror) filterVisibilitaMobileMirror.value = filterVisibilita?.value || "tutti";
  if (filterArchivioMobileMirror) filterArchivioMobileMirror.value = filterArchivio?.value || "tutti";
}

function syncMobileMirrorsToDesktop() {
  if (searchText && searchTextMobileMirror) searchText.value = searchTextMobileMirror.value;
  if (filterComune && filterComuneMobileMirror) filterComune.value = filterComuneMobileMirror.value;
  if (filterStatus && filterStatusMobileMirror) filterStatus.value = filterStatusMobileMirror.value;
  if (filterWorkflow && filterWorkflowMobileMirror) filterWorkflow.value = filterWorkflowMobileMirror.value;
  if (filterVisibilita && filterVisibilitaMobileMirror) filterVisibilita.value = filterVisibilitaMobileMirror.value;
  if (filterArchivio && filterArchivioMobileMirror) filterArchivio.value = filterArchivioMobileMirror.value;
}

function openMobileFilters() {
  syncDesktopToMobileMirrors();
  if (mobileFiltersPanel) {
    mobileFiltersPanel.classList.remove("hidden");
    mobileFiltersPanel.setAttribute("aria-hidden", "false");
  }
}

function closeMobileFilters() {
  if (mobileFiltersPanel) {
    mobileFiltersPanel.classList.add("hidden");
    mobileFiltersPanel.setAttribute("aria-hidden", "true");
  }
}

function resetAllFilters() {
  if (searchText) searchText.value = "";
  if (filterComune) filterComune.value = "tutti";
  if (filterStatus) filterStatus.value = "tutti";
  if (filterWorkflow) filterWorkflow.value = "tutti";
  if (filterVisibilita) filterVisibilita.value = "tutti";
  if (filterArchivio) filterArchivio.value = "tutti";

  syncDesktopToMobileMirrors();
  renderPoints();
  closeAllDesktopDropdowns();
  closeMobileFilters();
}

function getFilteredPoints() {
  const comuneValue = filterComune ? filterComune.value : "tutti";
  const statusValue = filterStatus ? filterStatus.value : "tutti";
  const workflowValue = filterWorkflow ? filterWorkflow.value : "tutti";
  const visibilitaValue = filterVisibilita ? filterVisibilita.value : "tutti";
  const archivioValue = filterArchivio ? filterArchivio.value : "tutti";
  const q = normalizeText(searchText?.value || "").toLowerCase();

  return points.filter((point) => {
    const matchComune = comuneValue === "tutti" || point.comune === comuneValue;
    const matchStatus = statusValue === "tutti" || normalizeText(point.status) === statusValue;
    const matchWorkflow = workflowValue === "tutti" || normalizeText(point.workflow) === workflowValue;
    const matchVisibilita = visibilitaValue === "tutti" || normalizeText(point.visibilita) === visibilitaValue;
    const matchArchivio = archivioValue === "tutti" || normalizeText(point.statoArchivio) === archivioValue;
    const haystack = `${point.codice} ${point.title} ${point.luogo} ${point.comune}`.toLowerCase();
    const matchSearch = !q || haystack.includes(q);

    return matchComune && matchStatus && matchWorkflow && matchVisibilita && matchArchivio && matchSearch;
  });
}

// -------------------------------
// UI VARIE
// -------------------------------

function updateLegendCounts() {
  const rosso = points.filter((p) => p.status === "rosso").length;
  const arancione = points.filter((p) => p.status === "arancione").length;
  const verde = points.filter((p) => p.status === "verde").length;

  if (countRosso) countRosso.textContent = rosso;
  if (countArancione) countArancione.textContent = arancione;
  if (countVerde) countVerde.textContent = verde;
  if (countTotale) countTotale.textContent = points.length;
}

function openLegend() {
  updateLegendCounts();
  if (legendModal) {
    legendModal.classList.remove("hidden");
    legendModal.setAttribute("aria-hidden", "false");
  }
}

function closeLegend() {
  if (legendModal) {
    legendModal.classList.add("hidden");
    legendModal.setAttribute("aria-hidden", "true");
  }
}

function buildPhotoButtons(point) {
  const buttons = [];
  if (point.foto1) buttons.push(`<button type="button" class="foto-btn" data-foto="${fotoPublicUrl(point.foto1)}">Foto 1</button>`);
  if (point.foto2) buttons.push(`<button type="button" class="foto-btn" data-foto="${fotoPublicUrl(point.foto2)}">Foto 2</button>`);
  if (point.foto3) buttons.push(`<button type="button" class="foto-btn" data-foto="${fotoPublicUrl(point.foto3)}">Foto 3</button>`);
  return buttons.join(" ");
}

function buildPopup(point) {
  const buttonsHtml = buildPhotoButtons(point);
  const gpsHtml = point.gpsLat && point.gpsLng
    ? `<br><small>GPS telefono: ${Number(point.gpsLat).toFixed(5)}, ${Number(point.gpsLng).toFixed(5)}</small>`
    : "";

  return `
    <div class="popup-content" data-point-id="${point.id}">
      <div class="segnalazione-code">${point.codice || "-"}</div>
      <b>${point.title}</b><br>
      ${point.comune} · ${getStatusLabel(point.status)}<br>
      <i>${point.categoria}</i><br>
      <span class="${workflowBadgeClass(point.workflow)}">${workflowLabel(point.workflow)}</span><br>
      ${point.luogo}<br>
      ${point.description || ""}
      ${gpsHtml}
      ${buttonsHtml ? `<div class="popup-actions">${buttonsHtml}</div>` : ""}
      <div class="popup-foto-box"></div>
    </div>
  `;
}

function setCoordsBoxes(coords) {
  if (!coords) {
    if (selectedCoords) selectedCoords.innerHTML = "Nessun punto selezionato";
    if (modalSelectedCoords) modalSelectedCoords.innerHTML = "Nessun punto selezionato";
    return;
  }

  const html = `
    <strong>Punto selezionato</strong><br>
    Lat: ${coords[0].toFixed(5)}<br>
    Lng: ${coords[1].toFixed(5)}
  `;

  if (selectedCoords) selectedCoords.innerHTML = html;
  if (modalSelectedCoords) modalSelectedCoords.innerHTML = html;
}

function openFormModal(isEdit = false) {
  formModalTitle.textContent = isEdit ? "Modifica segnalazione" : "Nuova segnalazione";
  formModal.classList.remove("hidden");
  formModal.setAttribute("aria-hidden", "false");
}

function closeFormModal() {
  formModal.classList.add("hidden");
  formModal.setAttribute("aria-hidden", "true");
  hideSuggestions(suggestionsComune);
  hideSuggestions(suggestionsCategoria);
  hideSuggestions(suggestionsLuogo);
}

function resetGpsStatus() {
  gpsPhoneCoords = null;
  if (gpsStatus) gpsStatus.textContent = "Non acquisito";
}

function clearForm() {
  formSegnalazione.reset();
  resetPhotoInputs();
  editingId = null;
  selectedCoordsValue = null;
  inputCodice.value = "";
  setCoordsBoxes(null);
  resetGpsStatus();
  closeFormModal();
}

function resetFormKeepPoint() {
  formSegnalazione.reset();
  resetPhotoInputs();
  resetGpsStatus();
  hideSuggestions(suggestionsComune);
  hideSuggestions(suggestionsCategoria);
  hideSuggestions(suggestionsLuogo);

  if (selectedCoordsValue) {
    setCoordsBoxes(selectedCoordsValue);
    if (!editingId) {
      inputCodice.value = generateNextCode(inputComune.value || "", points);
    }
  } else {
    inputCodice.value = "";
  }
}

function fillFormFromPoint(point) {
  inputCodice.value = point.codice || "";
  inputTitolo.value = point.title || "";
  inputComune.value = point.comune || "";
  inputCategoria.value = point.categoria || "";
  inputLuogo.value = point.luogo || "";
  inputDescrizione.value = point.description || "";
  inputStatus.value = point.status || "";
  inputWorkflow.value = point.workflow || "nuova";
  inputNomeSegnalante.value = point.nomeSegnalante || "";
  inputContattoSegnalante.value = point.contattoSegnalante || "";
  selectedCoordsValue = [...point.coords];
  editingId = point.id;
  gpsPhoneCoords = point.gpsLat && point.gpsLng ? [Number(point.gpsLat), Number(point.gpsLng)] : null;
  if (gpsStatus) gpsStatus.textContent = gpsPhoneCoords ? "GPS acquisito" : "Non acquisito";
  setCoordsBoxes(point.coords);
  resetPhotoInputs();
  openFormModal(true);
}

function wirePopupActions(marker) {
  marker.on("popupopen", (e) => {
    const popupEl = e.popup.getElement();
    if (!popupEl) return;

    const buttons = popupEl.querySelectorAll(".foto-btn");
    const box = popupEl.querySelector(".popup-foto-box");

    if (box) {
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const url = btn.getAttribute("data-foto");
          if (!url) return;

          box.innerHTML = `
            <img
              src="${url}"
              alt="Foto segnalazione"
              style="max-width:220px; width:100%; border-radius:10px; display:block;"
            >
          `;
        });
      });
    }
  });
}

function renderPoints() {
  markersLayer.clearLayers();
  if (listaSegnalazioni) listaSegnalazioni.innerHTML = "";

  const filtered = getFilteredPoints();

  filtered.forEach((point) => {
    if (!Array.isArray(point.coords) || point.coords.some((v) => Number.isNaN(v))) return;

    const marker = L.circleMarker(point.coords, {
      radius: 12,
      color: getColor(point.status),
      fillColor: getColor(point.status),
      fillOpacity: 1,
      weight: 2
    }).addTo(markersLayer);

    marker.bindPopup(buildPopup(point), {
      autoClose: true,
      closeOnClick: true
    });

    wirePopupActions(marker);

    if (listaSegnalazioni) {
      const item = document.createElement("div");
      item.className = "segnalazione-item";
      item.innerHTML = `
        <div class="segnalazione-code">${point.codice || "-"}</div>
        <strong>${point.title}</strong><br>
        <small>${point.comune} · ${getStatusLabel(point.status)}</small><br>
        <small><b>${point.categoria}</b></small><br>
        <small>${point.luogo}</small><br>
        <small>${point.description || ""}</small><br>
        <small class="${workflowBadgeClass(point.workflow)}">${workflowLabel(point.workflow)}</small>
      `;

      listaSegnalazioni.appendChild(item);

      item.addEventListener("click", () => {
        map.setView(point.coords, 18);
        marker.openPopup();
      });
    }
  });

  if (listaSegnalazioni && filtered.length === 0) {
    listaSegnalazioni.innerHTML = "Nessuna segnalazione trovata";
  }

  updateLegendCounts();
  refreshMapSize();
}

// -------------------------------
// DB
// -------------------------------

async function loadPointsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("segnalazioni")
    .select("*")
    .eq("visibilita", "pubblica")
    .eq("stato_archivio", "attiva")
    .order("id", { ascending: true });

  if (error) {
    console.error("Errore lettura Supabase:", error);
    alert("Errore lettura database.");
    return;
  }

  points = (data || [])
    .map(dbRowToPoint)
    .filter((point) => Array.isArray(point.coords) && point.coords.every((v) => !Number.isNaN(v)));

  renderPoints();
}

async function uploadSinglePhoto(file) {
  if (!file) return null;

  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  const { error } = await supabaseClient
    .storage
    .from("foto")
    .upload(safeName, file, { upsert: false });

  if (error) {
    console.error(error);
    throw new Error("Errore caricamento foto.");
  }

  return safeName;
}

// -------------------------------
// EVENTI MAPPA
// -------------------------------

map.on("click", (e) => {
  const nearestPoint = findNearestPointWithinTolerance(e.latlng);

  if (nearestPoint) {
    map.setView(nearestPoint.coords, Math.max(map.getZoom(), 18));

    const targetLayer = markersLayer.getLayers().find((layer) => {
      if (!layer.getLatLng) return false;
      const ll = layer.getLatLng();
      return (
        Math.abs(ll.lat - nearestPoint.coords[0]) < 0.000001 &&
        Math.abs(ll.lng - nearestPoint.coords[1]) < 0.000001
      );
    });

    if (targetLayer) {
      targetLayer.openPopup();
      return;
    }
  }

  selectedCoordsValue = [e.latlng.lat, e.latlng.lng];
  editingId = null;
  setCoordsBoxes(selectedCoordsValue);
  resetGpsStatus();
  resetPhotoInputs();
  inputCodice.value = generateNextCode(inputComune.value || "", points);
  openFormModal(false);
});

// -------------------------------
// SUBMIT FORM
// -------------------------------

formSegnalazione.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = normalizeDisplayText(inputTitolo.value);
  const comune = cleanComuneValue(inputComune.value);
  const categoria = cleanCategoriaValue(inputCategoria.value);
  const luogo = cleanLuogoValue(inputLuogo.value);
  const description = normalizeText(inputDescrizione.value);
  const status = normalizeStatus(inputStatus.value);
  const workflow = normalizeText(inputWorkflow.value).toLowerCase();
  const nomeSegnalante = normalizeDisplayText(inputNomeSegnalante.value);
  const contattoSegnalante = normalizeText(inputContattoSegnalante.value);

  if (!selectedCoordsValue) {
    alert("Prima clicca sulla mappa per scegliere il punto.");
    return;
  }

  if (!title) {
    alert("Inserisci un titolo valido.");
    return;
  }

  if (!comune) {
    alert("Seleziona un comune valido.");
    return;
  }

  if (!categoria) {
    alert("Seleziona una categoria valida.");
    return;
  }

  if (!luogo) {
    alert("Inserisci un luogo valido.");
    return;
  }

  if (!isValidStatus(status)) {
    alert("Seleziona uno stato valido: rosso, arancione o verde.");
    return;
  }

  try {
    let foto1 = null;
    let foto2 = null;
    let foto3 = null;

    const fileFoto1 = getSelectedFile(inputFoto1Camera, inputFoto1Gallery);
    const fileFoto2 = getSelectedFile(inputFoto2Camera, inputFoto2Gallery);
    const fileFoto3 = getSelectedFile(inputFoto3Camera, inputFoto3Gallery);

    if (fileFoto1) foto1 = await uploadSinglePhoto(fileFoto1);
    if (fileFoto2) foto2 = await uploadSinglePhoto(fileFoto2);
    if (fileFoto3) foto3 = await uploadSinglePhoto(fileFoto3);

    const point = {
      codice: editingId
        ? (points.find((p) => p.id === editingId)?.codice || generateNextCode(comune, points, editingId))
        : generateNextCode(comune, points),
      title,
      comune,
      categoria,
      status,
      workflow,
      visibilita: "pubblica",
      statoArchivio: "attiva",
      luogo,
      description,
      nomeSegnalante,
      contattoSegnalante,
      gpsLat: gpsPhoneCoords ? gpsPhoneCoords[0] : null,
      gpsLng: gpsPhoneCoords ? gpsPhoneCoords[1] : null,
      foto1,
      foto2,
      foto3,
      coords: [...selectedCoordsValue]
    };

    if (editingId) {
      const pointAttuale = points.find((p) => p.id === editingId);
      if (!pointAttuale) return;

      if (!foto1) point.foto1 = pointAttuale.foto1 || null;
      if (!foto2) point.foto2 = pointAttuale.foto2 || null;
      if (!foto3) point.foto3 = pointAttuale.foto3 || null;
      if (!point.gpsLat) point.gpsLat = pointAttuale.gpsLat || null;
      if (!point.gpsLng) point.gpsLng = pointAttuale.gpsLng || null;
      if (!point.visibilita) point.visibilita = pointAttuale.visibilita || "pubblica";
      if (!point.statoArchivio) point.statoArchivio = pointAttuale.statoArchivio || "attiva";

      const { error } = await supabaseClient
        .from("segnalazioni")
        .update(pointToDbRow(point))
        .eq("id", editingId);

      if (error) {
        alert("Modifica non riuscita: " + (error.message || "errore sconosciuto"));
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabaseClient
        .from("segnalazioni")
        .insert([pointToDbRow(point)]);

      if (error) {
        alert("Errore salvataggio su database: " + (error.message || "errore sconosciuto"));
        console.error(error);
        return;
      }
    }

    await loadPointsFromSupabase();
    clearForm();
  } catch (error) {
    alert(error.message || "Errore durante il caricamento delle foto.");
    console.error(error);
  }
});

// -------------------------------
// EVENTI CAMPI
// -------------------------------

if (inputComune) {
  inputComune.addEventListener("change", () => {
    const comunePulito = cleanComuneValue(inputComune.value);

    if (comunePulito) {
      inputComune.value = comunePulito;

      if (!editingId) {
        inputCodice.value = generateNextCode(comunePulito, points);
      }
    }
  });

  inputComune.addEventListener("blur", () => {
    const comunePulito = cleanComuneValue(inputComune.value);

    if (comunePulito) {
      inputComune.value = comunePulito;

      if (!editingId) {
        inputCodice.value = generateNextCode(comunePulito, points);
      }
    }
  });
}

if (inputCategoria) {
  inputCategoria.addEventListener("blur", () => {
    const categoriaPulita = cleanCategoriaValue(inputCategoria.value);
    if (categoriaPulita) inputCategoria.value = categoriaPulita;
  });
}

if (inputLuogo) {
  inputLuogo.addEventListener("blur", () => {
    const luogoPulito = cleanLuogoValue(inputLuogo.value);
    if (luogoPulito) inputLuogo.value = luogoPulito;
  });
}

if (btnResetSegnalazione) {
  btnResetSegnalazione.addEventListener("click", () => {
    resetFormKeepPoint();
  });
}

if (btnGpsPhone) {
  btnGpsPhone.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("GPS non supportato da questo dispositivo o browser.");
      return;
    }

    gpsStatus.textContent = "Ricerca GPS...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        gpsPhoneCoords = [position.coords.latitude, position.coords.longitude];
        gpsStatus.textContent = `GPS acquisito: ${gpsPhoneCoords[0].toFixed(5)}, ${gpsPhoneCoords[1].toFixed(5)}`;
      },
      () => {
        gpsStatus.textContent = "GPS non acquisito";
        alert("Non sono riuscito a leggere il GPS del telefono.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

if (toggleSegnalazioni) {
  toggleSegnalazioni.addEventListener("click", () => {
    contenitoreSegnalazioni.classList.toggle("collapsed");
    refreshMapSize();
  });
}

if (toggleNuovoPunto) {
  toggleNuovoPunto.addEventListener("click", () => {
    contenitoreNuovoPunto.classList.toggle("collapsed");
    refreshMapSize();
  });
}

if (btnApriForm) {
  btnApriForm.addEventListener("click", () => {
    if (!selectedCoordsValue) {
      alert("Prima clicca sulla mappa per scegliere il punto.");
      return;
    }
    openFormModal(false);
  });
}

if (searchText) searchText.addEventListener("input", renderPoints);
if (filterComune) filterComune.addEventListener("change", renderPoints);
if (filterStatus) filterStatus.addEventListener("change", renderPoints);
if (filterWorkflow) filterWorkflow.addEventListener("change", renderPoints);
if (filterVisibilita) filterVisibilita.addEventListener("change", renderPoints);
if (filterArchivio) filterArchivio.addEventListener("change", renderPoints);

// -------------------------------
// MENU FILTRI DESKTOP/MOBILE
// -------------------------------

if (btnResetFilters) {
  btnResetFilters.addEventListener("click", resetAllFilters);
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDesktopDropdown(chip.dataset.target);
  });
});

if (btnToggleMobileFilters) {
  btnToggleMobileFilters.addEventListener("click", openMobileFilters);
}

if (btnCloseMobileFilters) {
  btnCloseMobileFilters.addEventListener("click", closeMobileFilters);
}

if (btnApplyMobileFilters) {
  btnApplyMobileFilters.addEventListener("click", () => {
    syncMobileMirrorsToDesktop();
    renderPoints();
    closeMobileFilters();
  });
}

if (btnResetMobileFilters) {
  btnResetMobileFilters.addEventListener("click", resetAllFilters);
}

// -------------------------------
// LEGENDA
// -------------------------------

if (btnLegend) {
  btnLegend.addEventListener("click", openLegend);
}

if (btnLegendMobile) {
  btnLegendMobile.addEventListener("click", openLegend);
}

if (btnCloseLegend) {
  btnCloseLegend.addEventListener("click", closeLegend);
}

if (legendModal) {
  legendModal.addEventListener("click", (e) => {
    if (e.target === legendModal) {
      closeLegend();
    }
  });
}

// -------------------------------
// MODAL FORM
// -------------------------------

if (btnCloseFormModal) {
  btnCloseFormModal.addEventListener("click", closeFormModal);
}

if (formModal) {
  formModal.addEventListener("click", (e) => {
    if (e.target === formModal) {
      closeFormModal();
    }
  });
}

if (mobileFiltersPanel) {
  mobileFiltersPanel.addEventListener("click", (e) => {
    if (e.target === mobileFiltersPanel) {
      closeMobileFilters();
    }
  });
}

// -------------------------------
// GEOLOCALIZZAZIONE UTENTE
// -------------------------------

if (btnLocate) {
  btnLocate.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("La geolocalizzazione non è supportata da questo dispositivo o browser.");
      return;
    }

    btnLocate.disabled = true;
    btnLocate.textContent = "⌛ Ricerca posizione...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 17);

        if (userMarker) {
          map.removeLayer(userMarker);
        }

        userMarker = L.circleMarker([lat, lng], {
          radius: 12,
          color: "#1f4b7a",
          fillColor: "#1f4b7a",
          fillOpacity: 1,
          weight: 2
        }).addTo(map);

        userMarker.bindPopup("<strong>Sei qui</strong>").openPopup();

        btnLocate.disabled = false;
        btnLocate.textContent = "📍 Posizione";
        refreshMapSize();
      },
      () => {
        alert("Non sono riuscito a trovare la tua posizione.");
        btnLocate.disabled = false;
        btnLocate.textContent = "📍 Posizione";
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// -------------------------------
// CLICK GENERALI
// -------------------------------

document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-field")) {
    hideSuggestions(suggestionsComune);
    hideSuggestions(suggestionsCategoria);
    hideSuggestions(suggestionsLuogo);
  }

  if (!e.target.closest(".filterbar") && !e.target.closest(".filter-dropdown")) {
    closeAllDesktopDropdowns();
  }
});

// -------------------------------
// AVVIO
// -------------------------------

attachAutocomplete(inputComune, suggestionsComune, "comuni");
attachAutocomplete(inputCategoria, suggestionsCategoria, "categorie");
attachAutocomplete(inputLuogo, suggestionsLuogo, "luoghi");

window.addEventListener("load", async () => {
  refreshMapSize();
  syncDesktopToMobileMirrors();
  await loadPointsFromSupabase();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      console.log("Service Worker registrato correttamente");
    } catch (error) {
      console.error("Errore registrazione Service Worker:", error);
    }
  }
});
