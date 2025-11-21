const API_BASE = "https://let-waat.onrender.com/api";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const uploadInput = document.getElementById("upload");

const detectedEl = document.getElementById("detected");
const rawEl = document.getElementById("raw");

const listEl = document.getElementById("list");
const saveBtn = document.getElementById("save");
const refreshBtn = document.getElementById("refresh");
const compareBtn = document.getElementById("compareBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

let selected = [null, null];
let appliances = [];

// CAMERA START
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("Camera blocked. Allow camera permission.");
  }
}
startCamera();

// OCR REQUEST
async function sendBlob(blob) {
  const fd = new FormData();
  fd.append("image", blob);

  const res = await fetch(`${API_BASE}/ocr`, { method: "POST", body: fd });
  return await res.json();
}

// SCAN BUTTON
captureBtn.onclick = async () => {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;

  canvas.getContext("2d").drawImage(video, 0, 0, w, h);

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    detectedEl.textContent = "Scanning…";

    const result = await sendBlob(blob);
    handleOcr(result);
  }, "image/jpeg", 0.92);
};

// FILE UPLOAD
uploadInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  detectedEl.textContent = "Scanning…";
  const result = await sendBlob(file);
  handleOcr(result);
};

// HANDLE OCR
function handleOcr(res) {
  detectedEl.textContent = res.estimated_kwh || res.estimated_kwh_per_year || "Not detected";
  rawEl.textContent = res.raw_text || "—";
}

// SAVE APPLIANCE
saveBtn.onclick = async () => {
  const fd = new FormData();
  fd.append("name", document.getElementById("name").value || "Unnamed");
  fd.append("price", document.getElementById("price").value || 0);
  fd.append("energy_rate", document.getElementById("rate").value || 0);
  fd.append("aec", document.getElementById("manualAec").value || detectedEl.textContent);

  const res = await fetch(`${API_BASE}/add_appliance`, { method: "POST", body: fd });
  alert("Saved!");
  fetchList();
};

// GET LIST
async function fetchList() {
  const res = await fetch(`${API_BASE}/list_appliances`);
  appliances = await res.json();
  renderList();
}
fetchList();
refreshBtn.onclick = fetchList;

function renderList() {
  listEl.innerHTML = "";
  appliances.forEach(a => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <strong>${a.name}</strong><br>
        <small>${a.energy_kwh} kWh/year • ₹${a.price}</small>
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
  selected[slot] = id;
};

// COMPARE
compareBtn.onclick = async () => {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: selected })
  });

  document.getElementById("compareResult").textContent =
    JSON.stringify(await res.json(), null, 2);
};

// EXPORT PDF
exportPdfBtn.onclick = async () => {
  const res = await fetch(`${API_BASE}/export_pdf`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "WattCompare_Report.pdf";
  a.click();
};
