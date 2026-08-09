const status = document.querySelector("#status");

async function loadStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();
    status.innerHTML = Object.entries(data)
      .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
      .join("");
  } catch {
    status.innerHTML = "<div><dt>status</dt><dd>unavailable</dd></div>";
  }
}

void loadStatus();
