const modeButtons = document.querySelectorAll("[data-mode]");
const costTarget = document.querySelector("[data-credit-cost]");
const modeTarget = document.querySelector("[data-mode-label]");
const queueTarget = document.querySelector("[data-queue]");
const generateButton = document.querySelector("[data-generate]");
const enhanceButton = document.querySelector("[data-enhance]");
const promptBox = document.querySelector(".hero-textarea");

const modeCosts = {
  image: 8,
  video: 24,
  character: 12
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const mode = button.dataset.mode || "image";
    if (costTarget) costTarget.textContent = `${modeCosts[mode] || 8} credits`;
    if (modeTarget) {
      modeTarget.textContent = mode === "video"
        ? "Video generation"
        : mode === "character"
          ? "Character generation"
          : "Image generation";
    }
  });
});

if (enhanceButton && promptBox) {
  enhanceButton.addEventListener("click", () => {
    if (!promptBox.value.includes("ultra-detailed")) {
      promptBox.value = `${promptBox.value.trim()} ultra-detailed, gallery-ready, cinematic composition, reusable reference metadata`;
    }
  });
}

if (generateButton && queueTarget) {
  generateButton.addEventListener("click", () => {
    const activeMode = document.querySelector("[data-mode].active")?.dataset.mode || "image";
    const row = document.createElement("article");
    row.className = "result-row";
    row.innerHTML = `
      <span class="thumb ${activeMode === "video" ? "art-7" : "art-3"}"></span>
      <div>
        <strong>${activeMode === "video" ? "Video" : "Image"} generation queued</strong>
        <p>Demo job created. Backend API wiring is reserved for Sprint 3 implementation.</p>
      </div>
      <a href="./history.html">History</a>
    `;
    queueTarget.prepend(row);
  });
}

const filterInput = document.querySelector("[data-gallery-filter]");
const assetCards = document.querySelectorAll("[data-asset]");

if (filterInput) {
  filterInput.addEventListener("input", () => {
    const value = filterInput.value.trim().toLowerCase();
    assetCards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.hidden = value.length > 0 && !text.includes(value);
    });
  });
}

const intervalToggle = document.querySelector("[data-interval]");
const priceTargets = document.querySelectorAll("[data-monthly][data-yearly]");

if (intervalToggle) {
  intervalToggle.addEventListener("change", () => {
    const yearly = intervalToggle.value === "yearly";
    priceTargets.forEach((target) => {
      target.textContent = yearly ? target.dataset.yearly : target.dataset.monthly;
    });
  });
}
