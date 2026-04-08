// ===============================
// MAPPA DELL'ACCESSIBILITÀ
// ===============================

const SUPABASE_URL = "https://fawxdgdlmhuadpxjjpac.supabase.co";
const SUPABASE_KEY = "sb_publishable_-BATje0RS7UM8GMtRiQjkQ_vujpg8ho";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// true se siamo nella pagina operatori/admin
const IS_OPERATOR_VIEW = window.location.pathname.toLowerCase().includes("admin-mappa.html");

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase();
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

function fotoPublicUrl(nomeFile) {
  if (!nomeFile) return "";
  const { data } = supabaseClient.storage.from("foto").getPublicUrl(nomeFile);
  return data.publicUrl;
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

function visibilitaLabel(value) {
  return normalizeText(value).toLowerCase() === "nascosta" ? "Nascosta" : "Pubblica";
}

function archivioLabel(value) {
  return normalizeText(value).toLowerCase() === "archiviata" ? "Archiviata" : "Attiva";
}

function dbRowToPoint(row) {
  const latValue = Number(row.lat ?? row.Lat);
  const lngValue = Number(row.lng ?? row.Lng ?? row.log ?? row.Log);

  return {
    id: row.id,
    codice: row.codice || row.Codice || "",
    title: row.titolo || row.Titolo || "",
    comune: row.comune || row.Comune || "",
    categoria: row.categoria || row.Categoria || "Altro",
    status: normalizeStatus(row.stato || row.Stato || ""),
    workflow: normalizeText(row.statosegnalazione || row.StatoSegnalazione || "nuova").toLowerCase(),
    visibilita: normalizeText(row.visibilita || "pubblica").toLowerCase(),
    statoArchivio: normalizeText(row.stato_archivio || "attiva").toLowerCase(),
    luogo: row.luogo || row.Luogo || "",
    description: row.descrizione || row.Descrizione || "",
    motivoArchiviazione: row.motivo_archiviazione || "",
    dataArchiviazione: row.data_archiviazione || null,
    archiviataDa: row.archiviata_da || "",
    nomeSegnalante: row.nomesegnalante || row.NomeSegnalante || "",
    contattoSegnalante: row.contattosegnalante || row["contatto segnalatore"] || row.ContattoSegnalante || "",
    gpsLat: row.gpslat ?? row.GPSlat ?? row.GpsLat ?? null,
    gpsLng: row.gpslng ?? row.GPSLNG ?? row.GpsLng ?? null,
    foto1: row.foto1 || null,
    foto2: row.foto2 || null,
    foto3: row.foto3 || null,
    coords: [latValue, lngValue]
  };
}

function pointToDbRow(point) {
  return {
    Codice: point.codice,
    Titolo: point.title,
    Comune: point.comune,
    Categoria: point.categoria,
    Luogo: point.luogo,
    Descrizione: point.description,
    Stato: point.status,
    statosegnalazione: point.workflow,
    visibilita: point.visibilita || "pubblica",
    stato_archivio: point.statoArchivio || "attiva",
    motivo_archiviazione: point.motivoArchiviazione || null,
    data_archiviazione: point.dataArchiviazione || null,
    archiviata_da: point.archiviataDa || null,
    nomesegnalante: point.nomeSegnalante,
    contattosegnalante: point.contattoSegnalante,
    gpslat: point.gpsLat,
    gpslng: point.gpsLng,
    Lat: point.coords[0],
    Log: point.coords[1],
    foto1: point.foto1 || null,
    foto2: point.foto2 || null,
    foto3: point.foto3 || null
  };
}

function comunePrefix(comune) {
  const c = normalizeText(comune).toLowerCase();
  if (c === "san cataldo") return "SC";
  if (c === "caltanissetta") return "CL";
  return "PT";
}

function generateNextCode(comune, existingPoints, currentId = null) {
  const prefix = comunePrefix(comune);
  const sameComune = existingPoints.filter(
    p => p.id !== currentId && comunePrefix(p.comune) === prefix
  );

  let maxNum = 0;
  sameComune.forEach(p => {
    const match = String(p.codice || "").match(/-(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      if (n > maxNum) maxNum = n;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, "0");
  return `${prefix}-${nextNum}`;
}

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

const markersLayer = L.layerGroup().addTo(map);
let userMarker = null;
let points = [];
let selectedCoordsValue = null;
let editingId = null;
let gpsPhoneCoords = null;

const searchText = document.getElementById("searchText");
const filterComune = document.getElementById("filterComune");
const filterStatus = document.getElementById("filterStatus");
const filterWorkflow = document.getElementById("filterWorkflow");
const filterVisibilita = document.getElementById("filterVisibilita");
const filterArchivio = document.getElementById("filterArchivio");

const btnToggleFilters = document.getElementById("btnToggleFilters");
const filtersContainer = document.getElementById("filtersContainer");
const btnResetFilters = document.getElementById("btnResetFilters");

const countRosso = document.getElementById("countRosso");
const countArancione = document.getElementById("countArancione");
const countVerde = document.getElementById("countVerde");
const countTotale = document.getElementById("countTotale");

const btnLocate = document.getElementById("btnLocate");
const btnLegend = document.getElementById("btnLegend");
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
const inputFoto1 = document.getElementById("inputFoto1");
const inputFoto2 = document.getElementById("inputFoto2");
const inputFoto3 = document.getElementById("inputFoto3");
const btnResetSegnalazione = document.getElementById("btnResetSegnalazione");
const btnGpsPhone = document.getElementById("btnGpsPhone");
const gpsStatus = document.getElementById("gpsStatus");

const suggestionsComune = document.getElementById("suggestionsComune");
const suggestionsCategoria = document.getElementById("suggestionsCategoria");
const suggestionsLuogo = document.getElementById("suggestionsLuogo");

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map(normalizeText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
}

function getSuggestionValues(type) {
  if (type === "comuni") {
    return uniqueSorted(points.map((p) => p.comune).concat(["San Cataldo", "Caltanissetta"]));
  }

  if (type === "categorie") {
    return uniqueSorted(
      points.map((p) => p.categoria).concat([
        "Percorso pedonale",
        "Parcheggio disabili",
        "Rampa",
        "Ingresso edificio",
        "Farmacia",
        "Spazio pubblico",
        "Scuola",
        "Comune",
        "Barriera architettonica",
        "Altro"
      ])
    );
  }

  if (type === "luoghi") {
    return uniqueSorted(points.map((p) => p.luogo));
  }

  return [];
}

function filterSuggestionValues(values, text) {
  const t = normalizeText(text).toLowerCase();
  if (!t) return values.slice(0, 20);

  const starts = values.filter((v) => v.toLowerCase().startsWith(t));
  const includes = values.filter((v) => !v.toLowerCase().startsWith(t) && v.toLowerCase().includes(t));
  return [...starts, ...includes].slice(0, 20);
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

function updateLegendCounts() {
  const rosso = points.filter(p => p.status === "rosso").length;
  const arancione = points.filter(p => p.status === "arancione").length;
  const verde = points.filter(p => p.status === "verde").length;

  if (countRosso) countRosso.textContent = rosso;
  if (countArancione) countArancione.textContent = arancione;
  if (countVerde) countVerde.textContent = verde;
  if (countTotale) countTotale.textContent = points.length;
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

  const extraAdminInfo = IS_OPERATOR_VIEW ? `
    <br><small>Visibilità: ${visibilitaLabel(point.visibilita)}</small>
    <br><small>Archivio: ${archivioLabel(point.statoArchivio)}</small>
  ` : "";

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
      ${extraAdminInfo}
      ${buttonsHtml ? `<div class="popup-actions">${buttonsHtml}</div>` : ""}
      <div class="popup-foto-box"></div>
    </div>
  `;
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

    const haystack = `${point.codice} ${point.title} ${point.luogo} ${point.comune} ${point.categoria}`.toLowerCase();
    const matchSearch = !q || haystack.includes(q);

    return matchComune && matchStatus && matchWorkflow && matchVisibilita && matchArchivio && matchSearch;
  });
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
  if (!formModal || !formModalTitle) return;
  formModalTitle.textContent = isEdit ? "Modifica segnalazione" : "Nuova segnalazione";
  formModal.classList.remove("hidden");
  formModal.setAttribute("aria-hidden", "false");
}

function closeFormModal() {
  if (!formModal) return;
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
  if (!formSegnalazione) return;
  formSegnalazione.reset();
  editingId = null;
  selectedCoordsValue = null;
  if (inputCodice) inputCodice.value = "";
  setCoordsBoxes(null);
  resetGpsStatus();
  closeFormModal();
}

function resetFormKeepPoint() {
  if (!formSegnalazione) return;
  formSegnalazione.reset();
  resetGpsStatus();
  hideSuggestions(suggestionsComune);
  hideSuggestions(suggestionsCategoria);
  hideSuggestions(suggestionsLuogo);

  if (selectedCoordsValue) {
    setCoordsBoxes(selectedCoordsValue);
    if (!editingId && inputCodice) {
      inputCodice.value = generateNextCode(inputComune?.value || "", points);
    }
  } else if (inputCodice) {
    inputCodice.value = "";
  }
}

function fillFormFromPoint(point) {
  if (!inputCodice) return;

  inputCodice.value = point.codice || "";
  if (inputTitolo) inputTitolo.value = point.title || "";
  if (inputComune) inputComune.value = point.comune || "";
  if (inputCategoria) inputCategoria.value = point.categoria || "";
  if (inputLuogo) inputLuogo.value = point.luogo || "";
  if (inputDescrizione) inputDescrizione.value = point.description || "";
  if (inputStatus) inputStatus.value = point.status || "";
  if (inputWorkflow) inputWorkflow.value = point.workflow || "nuova";
  if (inputNomeSegnalante) inputNomeSegnalante.value = point.nomeSegnalante || "";
  if (inputContattoSegnalante) inputContattoSegnalante.value = point.contattoSegnalante || "";

  selectedCoordsValue = [...point.coords];
  editingId = point.id;
  gpsPhoneCoords = point.gpsLat && point.gpsLng ? [Number(point.gpsLat), Number(point.gpsLng)] : null;

  if (gpsStatus) gpsStatus.textContent = gpsPhoneCoords ? "GPS acquisito" : "Non acquisito";
  setCoordsBoxes(point.coords);
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
  });

  updateLegendCounts();
  refreshMapSize();
}

async function loadPointsFromSupabase() {
  let query = supabaseClient
    .from("segnalazioni")
    .select("*")
    .order("id", { ascending: true });

  if (!IS_OPERATOR_VIEW) {
    query = query
      .eq("visibilita", "pubblica")
      .eq("stato_archivio", "attiva");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Errore lettura Supabase:", error);
    alert("Errore lettura database.");
    return;
  }

  points = (data || []).map(dbRowToPoint).filter((point) => {
    return Array.isArray(point.coords) && point.coords.every((v) => !Number.isNaN(v));
  });

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

map.on("click", (e) => {
  const nearestPoint = findNearestPointWithinTolerance(e.latlng, 26);

  if (nearestPoint) {
    map.setView(nearestPoint.coords, Math.max(map.getZoom(), 18));

    markersLayer.eachLayer((layer) => {
      const layerLatLng = layer.getLatLng ? layer.getLatLng() : null;
      if (!layerLatLng) return;

      const sameLat = Math.abs(layerLatLng.lat - nearestPoint.coords[0]) < 0.000001;
      const sameLng = Math.abs(layerLatLng.lng - nearestPoint.coords[1]) < 0.000001;

      if (sameLat && sameLng && layer.openPopup) {
        layer.openPopup();
      }
    });
    return;
  }

  selectedCoordsValue = [e.latlng.lat, e.latlng.lng];
  editingId = null;
  setCoordsBoxes(selectedCoordsValue);
  resetGpsStatus();

  if (inputCodice) {
    inputCodice.value = generateNextCode(inputComune?.value || "", points);
  }

  openFormModal(false);
});

if (formSegnalazione) {
  formSegnalazione.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = normalizeText(inputTitolo?.value);
    const comune = normalizeText(inputComune?.value);
    const categoria = normalizeText(inputCategoria?.value);
    const luogo = normalizeText(inputLuogo?.value);
    const description = normalizeText(inputDescrizione?.value);
    const status = normalizeStatus(inputStatus?.value);
    const workflow = normalizeText(inputWorkflow?.value).toLowerCase();
    const nomeSegnalante = normalizeText(inputNomeSegnalante?.value);
    const contattoSegnalante = normalizeText(inputContattoSegnalante?.value);

    if (!selectedCoordsValue) {
      alert("Prima clicca sulla mappa per scegliere il punto.");
      return;
    }

    if (!title || !comune || !categoria || !luogo) {
      alert("Compila tutti i campi obbligatori.");
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

      if (inputFoto1 && inputFoto1.files.length > 0) foto1 = await uploadSinglePhoto(inputFoto1.files[0]);
      if (inputFoto2 && inputFoto2.files.length > 0) foto2 = await uploadSinglePhoto(inputFoto2.files[0]);
      if (inputFoto3 && inputFoto3.files.length > 0) foto3 = await uploadSinglePhoto(inputFoto3.files[0]);

      const point = {
        codice: editingId
          ? (points.find(p => p.id === editingId)?.codice || generateNextCode(comune, points, editingId))
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
        motivoArchiviazione: null,
        dataArchiviazione: null,
        archiviataDa: null,
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
        point.visibilita = pointAttuale.visibilita || "pubblica";
        point.statoArchivio = pointAttuale.statoArchivio || "attiva";
        point.motivoArchiviazione = pointAttuale.motivoArchiviazione || null;
        point.dataArchiviazione = pointAttuale.dataArchiviazione || null;
        point.archiviataDa = pointAttuale.archiviataDa || null;

        const { error } = await supabaseClient
          .from("segnalazioni")
          .update(pointToDbRow(point))
          .eq("id", editingId);

        if (error) {
          alert("Modifica non riuscita.");
          console.error(error);
          return;
        }
      } else {
        const { error } = await supabaseClient
          .from("segnalazioni")
          .insert([pointToDbRow(point)]);

        if (error) {
          alert("Errore salvataggio su database.");
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
}

if (inputComune) {
  inputComune.addEventListener("change", () => {
    if (!editingId && inputCodice) {
      inputCodice.value = generateNextCode(inputComune.value, points);
    }
  });

  inputComune.addEventListener("blur", () => {
    if (!editingId && normalizeText(inputComune.value) && inputCodice) {
      inputCodice.value = generateNextCode(inputComune.value, points);
    }
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

    if (gpsStatus) gpsStatus.textContent = "Ricerca GPS...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        gpsPhoneCoords = [position.coords.latitude, position.coords.longitude];
        if (gpsStatus) {
          gpsStatus.textContent = `GPS acquisito: ${gpsPhoneCoords[0].toFixed(5)}, ${gpsPhoneCoords[1].toFixed(5)}`;
        }
      },
      () => {
        if (gpsStatus) gpsStatus.textContent = "GPS non acquisito";
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

if (searchText) searchText.addEventListener("input", renderPoints);
if (filterComune) filterComune.addEventListener("change", renderPoints);
if (filterStatus) filterStatus.addEventListener("change", renderPoints);
if (filterWorkflow) filterWorkflow.addEventListener("change", renderPoints);
if (filterVisibilita) filterVisibilita.addEventListener("change", renderPoints);
if (filterArchivio) filterArchivio.addEventListener("change", renderPoints);

if (btnToggleFilters && filtersContainer) {
  btnToggleFilters.addEventListener("click", () => {
    filtersContainer.classList.toggle("open");
    refreshMapSize();
  });
}

if (btnResetFilters) {
  btnResetFilters.addEventListener("click", () => {
    if (searchText) searchText.value = "";
    if (filterComune) filterComune.value = "tutti";
    if (filterStatus) filterStatus.value = "tutti";
    if (filterWorkflow) filterWorkflow.value = "tutti";
    if (filterVisibilita) filterVisibilita.value = "tutti";
    if (filterArchivio) filterArchivio.value = "tutti";
    renderPoints();
  });
}

if (btnLegend) {
  btnLegend.addEventListener("click", () => {
    updateLegendCounts();
    if (legendModal) {
      legendModal.classList.remove("hidden");
      legendModal.setAttribute("aria-hidden", "false");
    }
  });
}

if (btnCloseLegend) {
  btnCloseLegend.addEventListener("click", () => {
    if (legendModal) {
      legendModal.classList.add("hidden");
      legendModal.setAttribute("aria-hidden", "true");
    }
  });
}

if (legendModal) {
  legendModal.addEventListener("click", (e) => {
    if (e.target === legendModal) {
      legendModal.classList.add("hidden");
      legendModal.setAttribute("aria-hidden", "true");
    }
  });
}

if (btnCloseFormModal) {
  btnCloseFormModal.addEventListener("click", () => {
    closeFormModal();
  });
}

if (formModal) {
  formModal.addEventListener("click", (e) => {
    if (e.target === formModal) {
      closeFormModal();
    }
  });
}

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
        btnLocate.textContent = "📍 Mostra la mia posizione";
        refreshMapSize();
      },
      () => {
        alert("Non sono riuscito a trovare la tua posizione.");
        btnLocate.disabled = false;
        btnLocate.textContent = "📍 Mostra la mia posizione";
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-field")) {
    hideSuggestions(suggestionsComune);
    hideSuggestions(suggestionsCategoria);
    hideSuggestions(suggestionsLuogo);
  }
});

attachAutocomplete(inputComune, suggestionsComune, "comuni");
attachAutocomplete(inputCategoria, suggestionsCategoria, "categorie");
attachAutocomplete(inputLuogo, suggestionsLuogo, "luoghi");

window.addEventListener("load", async () => {
  refreshMapSize();
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
