// ===============================
// MAPPA DELL'ACCESSIBILITÀ
// VERSIONE COMPLETA CORRETTA
// ===============================

const SUPABASE_URL = "https://fawxdgdlmhuadpxjjpac.supabase.co";
const SUPABASE_KEY = "sb_publishable_-BATje0RS7UM8GMtRiQjkQ_vujpg8ho";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

function dbRowToPoint(row) {
  const latValue = Number(row.lat ?? row.Lat);
  const lngValue = Number(row.lng ?? row.Lng ?? row.log ?? row.Log);

  return {
    id: row.id,
    codice: row.codice || "",
    title: row.titolo || row.Titolo || "",
    comune: row.comune || row.Comune || "",
    categoria: row.categoria || row.Categoria || "Altro",
    status: normalizeStatus(row.stato || row.Stato || ""),
    workflow: normalizeText(row.statosegnalazione || row.StatoSegnalazione || "nuova").toLowerCase(),
    luogo: row.luogo || row.Luogo || "",
    description: row.descrizione || row.Descrizione || "",
    nomeSegnalante: row.nomesegnalante || row.NomeSegnalante || "",
    contattoSegnalante: row.contattosegnalante || row.ContattoSegnalante || "",
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
  const sameComune = existingPoints.filter(p => p.id !== currentId && comunePrefix(p.comune) === prefix);

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

const markersLayer = L.layerGroup().addTo(map);
let userMarker = null;
let points = [];
let selectedCoordsValue = null;
let editingId = null;
let gpsPhoneCoords = null;

const listaSegnalazioni = document.getElementById("listaSegnalazioni");
const toggleSegnalazioni = document.getElementById("toggleSegnalazioni");
const contenitoreSegnalazioni = document.getElementById("contenitoreSegnalazioni");

const searchText = document.getElementById("searchText");
const filterComune = document.getElementById("filterComune");
const filterStatus = document.getElementById("filterStatus");

const countRosso = document.getElementById("countRosso");
const countArancione = document.getElementById("countArancione");
const countVerde = document.getElementById("countVerde");
const countTotale = document.getElementById("countTotale");

const btnLocate = document.getElementById("btnLocate");
const btnLegend = document.getElementById("btnLegend");
const btnCloseLegend = document.getElementById("btnCloseLegend");
const legendModal = document.getElementById("legendModal");

const btnHowTo = document.getElementById("btnHowTo");
const btnCloseHowTo = document.getElementById("btnCloseHowTo");
const howToModal = document.getElementById("howToModal");

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map(normalizeText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
}

function updateLegendCounts() {
  const rosso = points.filter(p => p.status === "rosso").length;
  const arancione = points.filter(p => p.status === "arancione").length;
  const verde = points.filter(p => p.status === "verde").length;

  countRosso.textContent = rosso;
  countArancione.textContent = arancione;
  countVerde.textContent = verde;
  countTotale.textContent = points.length;
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
      <div class="popup-actions">
        <button type="button" class="popup-delete-btn" data-delete-id="${point.id}">Elimina</button>
      </div>
      <div class="popup-foto-box"></div>
    </div>
  `;
}

function getFilteredPoints() {
  const comuneValue = filterComune ? filterComune.value : "tutti";
  const statusValue = filterStatus ? filterStatus.value : "tutti";
  const q = normalizeText(searchText?.value || "").toLowerCase();

  return points.filter((point) => {
    const matchComune = comuneValue === "tutti" || point.comune === comuneValue;
    const matchStatus = statusValue === "tutti" || normalizeText(point.status) === statusValue;
    const haystack = `${point.codice} ${point.title} ${point.luogo} ${point.comune}`.toLowerCase();
    const matchSearch = !q || haystack.includes(q);
    return matchComune && matchStatus && matchSearch;
  });
}

async function deletePointById(pointId) {
  const point = points.find(p => p.id === pointId);
  if (!point) return;

  const conferma = confirm(`Vuoi eliminare la segnalazione "${point.title}" (${point.codice})?`);
  if (!conferma) return;

  const { error } = await supabaseClient
    .from("segnalazioni")
    .delete()
    .eq("id", pointId);

  if (error) {
    alert("Eliminazione non riuscita.");
    console.error(error);
    return;
  }

  const filesToDelete = [point.foto1, point.foto2, point.foto3].filter(Boolean);
  if (filesToDelete.length > 0) {
    await supabaseClient.storage.from("foto").remove(filesToDelete);
  }

  await loadPointsFromSupabase();
}

function wirePopupActions(marker) {
  marker.on("popupopen", (e) => {
    const popupEl = e.popup.getElement();
    if (!popupEl) return;

    const buttons = popupEl.querySelectorAll(".foto-btn");
    const box = popupEl.querySelector(".popup-foto-box");
    const deleteBtn = popupEl.querySelector(".popup-delete-btn");

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

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const pointId = Number(deleteBtn.getAttribute("data-delete-id"));
        await deletePointById(pointId);
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
      radius: 8,
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
        <small>${point.description || ""}</small>
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

async function loadPointsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("segnalazioni")
    .select("*")
    .order("id", { ascending: true });

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

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
}

if (btnLegend) {
  btnLegend.addEventListener("click", () => {
    updateLegendCounts();
    openModal(legendModal);
  });
}

if (btnCloseLegend) {
  btnCloseLegend.addEventListener("click", () => {
    closeModal(legendModal);
  });
}

if (btnHowTo) {
  btnHowTo.addEventListener("click", () => {
    openModal(howToModal);
  });
}

if (btnCloseHowTo) {
  btnCloseHowTo.addEventListener("click", () => {
    closeModal(howToModal);
  });
}

window.addEventListener("click", (e) => {
  if (e.target === legendModal) {
    closeModal(legendModal);
  }

  if (e.target === howToModal) {
    closeModal(howToModal);
  }
});

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
          radius: 8,
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

if (searchText) searchText.addEventListener("input", renderPoints);
if (filterComune) filterComune.addEventListener("change", renderPoints);
if (filterStatus) filterStatus.addEventListener("change", renderPoints);

if (toggleSegnalazioni) {
  toggleSegnalazioni.addEventListener("click", () => {
    const isHidden = contenitoreSegnalazioni.style.display === "none";
    contenitoreSegnalazioni.style.display = isHidden ? "block" : "none";
    toggleSegnalazioni.textContent = isHidden ? "Segnalazioni ▼" : "Segnalazioni ▲";
    refreshMapSize();
  });
}

window.addEventListener("load", async () => {
  refreshMapSize();
  await loadPointsFromSupabase();
});
