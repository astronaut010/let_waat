const API = "https://let-waat.onrender.com/api";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const detectedEl = document.getElementById("detected");
const rawEl = document.getElementById("raw");
const listEl = document.getElementById("list");
const compareResult = document.getElementById("compareResult");

let selected = [null, null];
let appliances = [];

// Start Camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera permission is blocked. Please enable camera access.");
  }
}
startCamera();

// OCR Process
async function sendImage(blob) {
  const fd = new FormData();
  fd.append("image", blob);

  const res = await fetch(`${API}/ocr`, { method: "POST", body: fd });
  return await res.json();
}

// Capture Button
document.getElementById("captureBtn").onclick = async () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d").drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    detectedEl.textContent = "Scanning…";
    const result = await sendImage(blob);
    showOCR(result);
  }, "image/jpeg");
};

// File Upload
document.getElementById("upload").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  detectedEl.textContent = "Scanning…";
  const res = await sendImage(file);
  showOCR(res);
};

// Display OCR results
function showOCR(res) {
  detectedEl.textContent = res.estimated_kwh || res.aec || "Not detected";
  rawEl.textContent = res.raw_text || "—";
}

// Save Appliance
document.getElementById("save").onclick = async () => {
  const fd = new FormData();
  fd.append("name", document.getElementById("name").value);
  fd.append("price", document.getElementById("price").value);
  fd.append("energy_rate", document.getElementById("rate").value);
  fd.append("aec", document.getElementById("manualAec").value || detectedEl.textContent);

  await fetch(`${API}/add_appliance`, { method: "POST", body: fd });

  alert("Saved!");
  loadList();
};

// Load Appliance List
async function loadList() {
  const res = await fetch(`${API}/list_appliances`);
  appliances = await res.json();
  renderItems();
}
loadList();

function renderItems() {
  listEl.innerHTML = "";
  appliances.forEach(a => {
    listEl.innerHTML += `
      <div class="item">
        <div>
          <strong>${a.name}</strong><br>
          <small>${a.energy_kwh} kWh/year • ₹${a.price}</small>
        </div>
        <div>
          <button class="slot-btn" onclick="slotSet(0, ${a.id})">A</button>
          <button class="slot-btn" onclick="slotSet(1, ${a.id})">B</button>
        </div>
      </div>
    `;
  });
}

window.slotSet = (slot, id) => {
  selected[slot] = id;
};

// Compare
document.getElementById("compareBtn").onclick = async () => {
  const res = await fetch(`${API}/compare`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ ids: selected })
  });

  compareResult.textContent = JSON.stringify(await res.json(), null, 2);
};

// Export PDF
document.getElementById("exportPdfBtn").onclick = async () => {
  const res = await fetch(`${API}/export_pdf`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = "WattCompare_Report.pdf";
  a.click();
};
