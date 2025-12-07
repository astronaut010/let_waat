// Your backend API
const API_BASE = "https://let-waat.onrender.com/api";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const uploadInput = document.getElementById("upload");

const detectedEl = document.getElementById("detected");
const rawEl = document.getElementById("raw");

const saveBtn = document.getElementById("save");
const listEl = document.getElementById("list");
const refreshBtn = document.getElementById("refresh");
const exportPdfBtn = document.getElementById("exportPdf");
const compareBtn = document.getElementById("compareBtn");
const compareResult = document.getElementById("compareResult");

let selectedForCompare = [null, null];
let appliances = [];

// -------- START CAMERA ----------
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
  } catch (err) {
    console.warn("Camera not available", err);
  }
}
startCamera();

// -------- OCR SEND ----------
async function sendBlobForOcr(blob) {
  const fd = new FormData();
  fd.append("image", blob);
  const res = await fetch(`${API_BASE}/ocr`, {
    method: "POST",
    body: fd
  });
  return await res.json();
}

captureBtn.onclick = () => {
  const w = video.videoWidth, h = video.videoHeight;
  canvas.width = w, canvas.height = h;
  canvas.getContext("2d").drawImage(video, 0, 0, w, h);

  canvas.toBlob(async (b) => {
    if (!b) return;
    const r = await sendBlobForOcr(b);
    handleOcrResult(r);
  }, "image/jpeg", 0.9);
};

uploadInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const r = await sendBlobForOcr(file);
  handleOcrResult(r);
};

function handleOcrResult(r) {
  detectedEl.textContent = r.estimated_kwh_per_year || "—";
  rawEl.textContent = r.raw_text || "—";
}

// -------- SAVE APPLIANCE ----------
saveBtn.onclick = async () => {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const rate = document.getElementById("rate").value;
  const manual = document.getElementById("manualAec").value;

  const kwh = manual || detectedEl.textContent;
  if (!kwh || kwh === "—") return alert("No AEC detected!");

  const fd = new FormData();
  fd.append("name", name);
  fd.append("price", price);
  fd.append("energy_rate", rate);
  fd.append("aec", kwh);

  const res = await fetch(`${API_BASE}/add_appliance`, { method: "POST", body: fd });
  alert("Saved successfully!");
  fetchList();
};

// -------- FETCH LIST ----------
async function fetchList() {
  const res = await fetch(`${API_BASE}/list_appliances`);
  appliances = await res.json();
  renderList();
}
refreshBtn.onclick = fetchList;
fetchList();

function renderList() {
  listEl.innerHTML = "";
  appliances.forEach(a => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div>
        <strong>${a.name}</strong><br>
        <small>${a.energy_kwh} kWh • ₹${a.price}</small>
      </div>
      <div>
        <button onclick="selectSlot(0, ${a.id})">Slot A</button>
        <button onclick="selectSlot(1, ${a.id})">Slot B</button>
      </div>
    `;

    listEl.appendChild(div);
  });
}

window.selectSlot = (slot, id) => {
  selectedForCompare[slot] = id;
};

// -------- COMPARE ----------
compareBtn.onclick = async () => {
  if (!selectedForCompare[0] || !selectedForCompare[1])
    return alert("Select two appliances!");

  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: selectedForCompare })
  });

  const data = await res.json();
  compareResult.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
};

// -------- EXPORT PDF ----------
exportPdfBtn.onclick = async () => {
  const res = await fetch(`${API_BASE}/export_pdf`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "WattCompare_Report.pdf";
  a.click();
  URL.revokeObjectURL(url);
};
