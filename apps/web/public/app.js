const status = document.querySelector("#status");

function renderStatus(entries) {
  const rows = entries.map(([key, value]) => {
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const content = document.createElement("dd");
    label.textContent = key;
    content.textContent = String(value);
    row.append(label, content);
    return row;
  });
  status.replaceChildren(...rows);
}

fetch("/api/status")
  .then((response) => response.json())
  .then((payload) => renderStatus(Object.entries(payload)))
  .catch(() => renderStatus([["status", "unavailable"]]));
