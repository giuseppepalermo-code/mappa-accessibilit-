const SUPABASE_URL = "https://fawxdgdlmhuadpxjjpac.supabase.co";
const SUPABASE_KEY = "INSERISCI_LA_TUA_CHIAVE_SUPABASE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map("map", {
  zoomControl: true
}).setView([37.4905, 14.0626], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

let points = [];
let selectedCoordsValue = null;
let editingId = null;
let gpsPhoneCoords = null;
let currentPopupImageIndex = 0;

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

const searchText = document.getElementById("searchText");
const filterComune = document.getElementById("filterComune");
const filterStatus = document.getElementById("filterStatus");
const filterWorkflow = document.getElementById("filterWorkflow");

const listaSegnalazioni = document.getElementById("listaSegnalazioni");
const selectedCoords = document.getElementById("selectedCoords");
const modalSelectedCoords = document.getElementById("modalSelectedCoords");

const formModal = document.getElementById("formModal");
const btnApriForm = document.getElementById("btnApriForm");
const btnCloseFormModal = document.getElementById("btnCloseFormModal");

const btnGpsPhone = document.getElementById("btnGpsPhone");
const gpsStatus = document.getElementById("gpsStatus");

const btnResetSegnalazione = document.getElementById("btnResetSegnalazione");
const formSegnalazione = document.getElementById("formSegnalazione");

const btnLocate = document.getElementById("btnLocate");
const btnLegend = document.getElementById("btnLegend");
const btnCloseLegend = document.getElementById("btnCloseLegend");
const legendModal = document.getElementById("legendModal");

const btnCloseHowTo = document.getElementById("btnCloseHowTo");
const howToModal = document.getElementById("howToModal");

const countRosso = document.getElementById("countRosso");
const countArancione = document.getElementById("countArancione");
const countVerde = document.getElementById("countVerde");
const countTotale = document.getElementById("countTotale");

const toggleSegnalazioni = document.getElementById("toggleSegnalazioni");
const contenitoreSegnalazioni = document.getElementById("contenitoreSegnalazioni");

const toggleNuovoPunto = document.getElementById("toggleNuovoPunto");
const contenitoreNuovoPunto = document.getElementById("contenitoreNuovoPunto");

const suggestionsComune = document.getElementById("suggestionsComune");
const suggestionsCategoria = document.getElementById("suggestionsCategoria");
const suggestionsLuogo = document.getElementById("suggestionsLuogo");

function normalizeText(value) {
  return (value || "").toString().trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase();
}

function getColor(status) {
  const s = normalizeStatus(status);
  if (s === "rosso") return "#d62828";
  if (s === "arancione") return "#f77f00";
  return "#2a9d8f";
}

function getStatusLabel(status) {
  const s = normalizeStatus(status);
  if (s === "rosso") return "Non accessibile";
  if (s === "arancione") return "Parzialmente accessibile";
  return "Accessibile";
}

function workflowLabel(value) {
  const v = normalizeText(value).toLowerCase();
  if (v === "presa in carico") return "Presa in carico";
  if (v === "chiusa") return "Chiusa";
  return "Nuova";
}

function workflowBadgeClass(value) {
  const v = normalizeText(value).toLowerCase();
  if (v === "presa in carico") return "wf-badge wf-orange";
  if (v === "chiusa") return "wf-badge wf-green";
  return "wf-badge wf-blue";
}

function fotoPublicUrl(fileName) {
  if (!fileName) return "";
  const { data } = supabaseClient.storage.from("foto").getPublicUrl(fileName);
  return data.publicUrl;
}

function updateCoordsBox() {
  if (!selectedCoordsValue) {
    selectedCoords.textContent = "Nessun punto selezionato";
    modalSelectedCoords.textContent = "Nessun punto selezionato";
    return;
  }

  const text = `Lat: ${selectedCoordsValue[0].toFixed(6)} | Lng: ${selectedCoordsValue[1].toFixed(6)}`;
  selectedCoords.textContent = text;
  modalSelectedCoords.textContent = text;
}

function comunePrefix(comune) {
  const c = normalizeText(comune).toLowerCase();
  if (c === "san cataldo") return "SC";
  if (c === "caltanissetta") return "CL";
  return "PT";
}

function generateNextCode(comune) {
  const prefix = comunePrefix(comune);
  const sameComune = points.filter(p => comunePrefix(p.comune) === prefix);

  let max = 0;
  sameComune.forEach(item => {
    const match = (item.codice || "").match(/-(\d+)/);
    if (match) {
      max = Math.max(max, parseInt(match[1]));
    }
  });

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function refreshMap() {
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function clearForm() {
  formSegnalazione.reset();
  editingId = null;
  gpsPhoneCoords = null;
  gpsStatus.textContent = "Non acquisito";
  inputCodice.value = "";
}

function updateLegendCounts() {
  countRosso.textContent = points.filter(p => p.status === "rosso").length;
  countArancione.textContent = points.filter(p => p.status === "arancione").length;
  countVerde.textContent = points.filter(p => p.status === "verde").length;
  countTotale.textContent = points.length;
}

function dbRowToPoint(row) {
  return {
    id: row.id,
    codice: row.codice || "",
    title: row.Titolo || row.titolo || "",
    comune: row.Comune || row.comune || "",
    categoria: row.Categoria || row.categoria || "",
    luogo: row.Luogo || row.luogo || "",
    description: row.Descrizione || row.descrizione || "",
    status: normalizeStatus(row.Stato || row.stato || ""),
    workflow: normalizeText(row.statosegnalazione || "nuova").toLowerCase(),
    nomeSegnalante: row.nomesegnalante || "",
    contattoSegnalante: row.contattosegnalante || "",
    gpsLat: row.gpslat || null,
    gpsLng: row.gpslng || null,
    foto1: row.foto1 || null,
    foto2: row.foto2 || null,
    foto3: row.foto3 || null,
    coords: [
      Number(row.Lat ?? row.lat),
      Number(row.Log ?? row.log ?? row.Lng ?? row.lng)
    ]
  };
}

async function loadPointsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("segnalazioni")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  points = (data || []).map(dbRowToPoint);
  populateAutocomplete();
  renderPoints();
}

function getFilteredPoints() {
  const query = normalizeText(searchText.value).toLowerCase();
  const comune = filterComune.value;
  const status = filterStatus.value;
  const workflow = filterWorkflow.value;

  return points.filter(point => {
    const matchText = !query || [
      point.codice,
      point.title,
      point.comune,
      point.luogo,
      point.description
    ].join(" ").toLowerCase().includes(query);

    const matchComune = comune === "tutti" || point.comune === comune;
    const matchStatus = status === "tutti" || point.status === status;
    const matchWorkflow = workflow === "tutti" || point.workflow === workflow;

    return matchText && matchComune && matchStatus && matchWorkflow;
  });
}

function renderPoints() {
  markersLayer.clearLayers();
  listaSegnalazioni.innerHTML = "";

  const filtered = getFilteredPoints();

  filtered.forEach(point => {
    const marker = L.circleMarker(point.coords, {
      radius: 9,
      color: getColor(point.status),
      fillColor: getColor(point.status),
      fillOpacity: 1,
      weight: 2
    }).addTo(markersLayer);

    const photoButtons = [point.foto1, point.foto2, point.foto3]
      .filter(Boolean)
      .map((foto, index) => {
        return `<button class="foto-btn" data-foto="${fotoPublicUrl(foto)}">Foto ${index + 1}</button>`;
      }).join("");

    marker.bindPopup(`
      <div class="popup-content">
        <div class="segnalazione-code">${point.codice}</div>
        <strong>${point.title}</strong><br>
        <small>${point.comune}</small><br>
        <small>${point.luogo}</small><br>
        <small>${point.description}</small><br>
        <span class="${workflowBadgeClass(point.workflow)}">${workflowLabel(point.workflow)}</span>
        <div class="popup-actions">
          ${photoButtons}
        </div>
        <div class="popup-foto-box"></div>
      </div>
    `);

    marker.on("popupopen", (e) => {
      const popup = e.popup.getElement();
      const fotoBtns = popup.querySelectorAll(".foto-btn");
      const fotoBox = popup.querySelector(".popup-foto-box");

      fotoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          fotoBox.innerHTML = `<img src="${btn.dataset.foto}" style="width:100%;border-radius:10px;margin-top:8px;">`;
        });
      });
    });

    const item = document.createElement("div");
    item.className = "segnalazione-item";
    item.innerHTML = `
      <div class="segnalazione-code">${point.codice}</div>
      <strong>${point.title}</strong>
      <small>${point.comune}</small>
      <small>${point.luogo}</small>
      <small>${getStatusLabel(point.status)}</small>
    `;

    item.addEventListener("click", () => {
      map.setView(point.coords, 18);
      marker.openPopup();
    });

    listaSegnalazioni.appendChild(item);
  });

  updateLegendCounts();
  refreshMap();
}

map.on("click", (e) => {
  selectedCoordsValue = [e.latlng.lat, e.latlng.lng];
  updateCoordsBox();
});

btnApriForm.addEventListener("click", () => {
  if (!selectedCoordsValue) {
    alert("Prima clicca un punto sulla mappa.");
    return;
  }

  inputCodice.value = generateNextCode(inputComune.value || "San Cataldo");
  openModal(formModal);
});

btnCloseFormModal.addEventListener("click", () => closeModal(formModal));
btnCloseLegend.addEventListener("click", () => closeModal(legendModal));
btnCloseHowTo.addEventListener("click", () => closeModal(howToModal));

btnLegend.addEventListener("click", () => {
  updateLegendCounts();
  openModal(legendModal);
});

btnResetSegnalazione.addEventListener("click", () => {
  clearForm();
  updateCoordsBox();
});

btnLocate.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    map.setView([lat, lng], 17);

    L.circleMarker([lat, lng], {
      radius: 9,
      color: "#1f4b7a",
      fillColor: "#1f4b7a",
      fillOpacity: 1
    }).addTo(map);
  });
});

btnGpsPhone.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(position => {
    gpsPhoneCoords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    gpsStatus.textContent = `GPS acquisito (${gpsPhoneCoords.lat.toFixed(4)}, ${gpsPhoneCoords.lng.toFixed(4)})`;
  });
});

formSegnalazione.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedCoordsValue) {
    alert("Seleziona prima un punto sulla mappa.");
    return;
  }

  const payload = {
    codice: inputCodice.value || generateNextCode(inputComune.value),
    Titolo: inputTitolo.value,
    Comune: inputComune.value,
    Categoria: inputCategoria.value,
    Luogo: inputLuogo.value,
    Descrizione: inputDescrizione.value,
    Stato: inputStatus.value,
    statosegnalazione: inputWorkflow.value,
    nomesegnalante: inputNomeSegnalante.value,
    contattosegnalante: inputContattoSegnalante.value,
    gpslat: gpsPhoneCoords?.lat || null,
    gpslng: gpsPhoneCoords?.lng || null,
    Lat: selectedCoordsValue[0],
    Log: selectedCoordsValue[1],
    foto1: null,
    foto2: null,
    foto3: null
  };

  const { error } = await supabaseClient.from("segnalazioni").insert([payload]);

  if (error) {
    console.error(error);
    alert("Errore durante il salvataggio.");
    return;
  }

  alert("Segnalazione salvata correttamente.");
  closeModal(formModal);
  clearForm();
  await loadPointsFromSupabase();
});

toggleSegnalazioni.addEventListener("click", () => {
  contenitoreSegnalazioni.classList.toggle("collapsed");
  refreshMap();
});

toggleNuovoPunto.addEventListener("click", () => {
  contenitoreNuovoPunto.classList.toggle("collapsed");
  refreshMap();
});

searchText.addEventListener("input", renderPoints);
filterComune.addEventListener("change", renderPoints);
filterStatus.addEventListener("change", renderPoints);
filterWorkflow.addEventListener("change", renderPoints);

window.addEventListener("click", (e) => {
  if (e.target === legendModal) closeModal(legendModal);
  if (e.target === howToModal) closeModal(howToModal);
  if (e.target === formModal) closeModal(formModal);
});

function populateAutocomplete() {
  setupSuggestions(inputComune, suggestionsComune, [...new Set(points.map(p => p.comune))]);
  setupSuggestions(inputCategoria, suggestionsCategoria, [...new Set(points.map(p => p.categoria))]);
  setupSuggestions(inputLuogo, suggestionsLuogo, [...new Set(points.map(p => p.luogo))]);
}

function setupSuggestions(input, box, values) {
  input.addEventListener("input", () => {
    const value = input.value.toLowerCase();
    box.innerHTML = "";

    if (!value) {
      box.classList.add("hidden");
      return;
    }

    const matches = values.filter(v => v && v.toLowerCase().includes(value)).slice(0, 8);

    matches.forEach(match => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = match;

      item.addEventListener("click", () => {
        input.value = match;
        box.classList.add("hidden");
      });

      box.appendChild(item);
    });

    box.classList.toggle("hidden", matches.length === 0);
  });

  document.addEventListener("click", (e) => {
    if (!box.contains(e.target) && e.target !== input) {
      box.classList.add("hidden");
    }
  });
}

window.addEventListener("load", async () => {
  updateCoordsBox();
  await loadPointsFromSupabase();
  refreshMap();
});
