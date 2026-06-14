const STORAGE_KEY = "haremoyo_state_v1";
const TODAY = new Date();

const defaultShared = [
  "コンビニの店員さんが目を見てありがとうって言ってくれた。",
  "洗濯物が一回で全部乾いた。今日はそれだけで勝ち。",
  "帰り道に金木犀みたいな匂いがして、少し元気になった。",
  "ずっと後回しにしていた返信ができた。えらい日。",
  "好きな曲のシャッフルが完璧だった。",
  "温かい味噌汁を飲んだら、体が戻ってきた感じがした。"
];

const eatMessages = [
  "ふわはれが食べました。よかったね。",
  "ふわはれがもぐもぐしました。もうここには置かなくて大丈夫。",
  "ふわはれのおなかにしまいました。今日はここでおしまい。",
  "ふわはれがぱくっと食べました。少し軽くなりますように。"
];

const state = loadState();
let selectedDate = toDateKey(TODAY);
let calendarMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
let photoData = "";

const moodText = document.getElementById("moodText");
const charCount = document.getElementById("charCount");
const badModeWrap = document.getElementById("badModeWrap");
const badModeDescription = document.getElementById("badModeDescription");
const coachSteps = document.getElementById("coachSteps");
const coachPreview = document.getElementById("coachPreview");
const shareCheck = document.getElementById("shareCheck");
const saveNotice = document.getElementById("saveNotice");
const photoInput = document.getElementById("photoInput");
const photoPreviewWrap = document.getElementById("photoPreviewWrap");
const photoPreview = document.getElementById("photoPreview");

document.querySelectorAll(".segment-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(".segment-btn", button);
    resetBadDraftState();
    updateMoodMode();
  });
});

document.querySelectorAll(".mini-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(".mini-btn", button);
    clearNotice();
    updateBadMode();
  });
});

document.querySelectorAll(".step-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(".step-btn", button);
    updateCoachPreview();
  });
});

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setActiveButton(".filter-btn", button);
    renderRecords();
  });
});

document.getElementById("saveButton").addEventListener("click", saveMood);
document.getElementById("addFavorite").addEventListener("click", addFavorite);
document.getElementById("favoriteInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") addFavorite();
});
document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
document.getElementById("removePhoto").addEventListener("click", clearPhoto);

moodText.addEventListener("input", () => {
  updateCharCount();
  updateCoachPreview();
});

photoInput.addEventListener("change", handlePhoto);

renderAll();
updateMoodMode();

function loadState() {
  const fallback = {
    records: [],
    favorites: ["温かい飲み物", "夜の散歩", "好きな音楽"],
    shared: defaultShared.map((text) => ({ id: createId(), text }))
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fallback;
    return {
      records: Array.isArray(saved.records) ? saved.records : [],
      favorites: Array.isArray(saved.favorites) ? saved.favorites : fallback.favorites,
      shared: Array.isArray(saved.shared) && saved.shared.length ? saved.shared : fallback.shared
    };
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getActiveMood() {
  return document.querySelector(".segment-btn.active")?.dataset.mood || "happy";
}

function getBadMode() {
  return document.querySelector(".mini-btn.active")?.dataset.badMode || "free";
}

function getCoachStep() {
  return document.querySelector(".step-btn.active")?.dataset.step || "1";
}

function setActiveButton(selector, activeButton) {
  document.querySelectorAll(selector).forEach((button) => button.classList.remove("active"));
  activeButton.classList.add("active");
}

function updateMoodMode() {
  const activeMood = getActiveMood();
  const isBad = activeMood === "bad";
  badModeWrap.classList.toggle("hidden", !isBad);
  shareCheck.disabled = isBad;
  if (isBad) {
    shareCheck.checked = false;
    updateBadMode();
  }
}

function updateBadMode() {
  const isPaid = getBadMode() === "paid";
  badModeDescription.textContent = isPaid
    ? "コーチングみたいに、気持ちをほどいて学びにします。"
    : "ふわはれが食べて、ここから消してくれます。";
  coachSteps.classList.toggle("hidden", !isPaid);
  coachPreview.classList.toggle("hidden", !isPaid);
  if (isPaid) updateCoachPreview();
}

function updateCoachPreview() {
  if (getActiveMood() !== "bad" || getBadMode() !== "paid") return;
  const text = moodText.value.trim() || "そのこと";
  const step = getCoachStep();
  const previewMap = {
    "1": `それは嫌でしたね。『${text}』が心に残ったのは、ちゃんとしんどかったからです。`,
    "2": `『${text}』でつらかったのは、安心したい気持ちや、自分のペースを大切にしたい気持ちがあったからかもしれません。`,
    "3": `『${text}』から、次は無理に飲み込まず、自分を守る選択をしていいと分かりました。`
  };
  coachPreview.textContent = previewMap[step];
}

function resetBadDraftState() {
  clearNotice();
  document.querySelector('[data-bad-mode="free"]').classList.add("active");
  document.querySelector('[data-bad-mode="paid"]').classList.remove("active");
  document.querySelectorAll(".step-btn").forEach((button) => button.classList.remove("active"));
  document.querySelector('[data-step="1"]').classList.add("active");
  coachPreview.textContent = "";
}

function saveMood() {
  const activeMood = getActiveMood();
  const text = moodText.value.trim();
  if (!text) {
    saveNotice.textContent = "ひと言だけでも書いてみてください。";
    return;
  }

  if (activeMood === "bad" && getBadMode() === "free") {
    moodText.value = "";
    clearPhoto();
    updateCharCount();
    saveNotice.textContent = eatMessages[Math.floor(Math.random() * eatMessages.length)];
    updateCoachPreview();
    return;
  }

  const now = new Date();
  const isLesson = activeMood === "bad";
  const body = isLesson ? coachPreview.textContent : text;
  const record = {
    id: createId(),
    type: isLesson ? "lesson" : activeMood,
    text: body,
    date: toDateKey(now),
    createdAt: now.toISOString(),
    photo: isLesson ? "" : photoData
  };

  state.records.unshift(record);

  if (!isLesson && shareCheck.checked) {
    state.shared.unshift({ id: createId(), text });
  }

  persist();
  moodText.value = "";
  shareCheck.checked = false;
  clearPhoto();
  updateCharCount();
  selectedDate = toDateKey(now);
  calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  setFilter("all");
  saveNotice.textContent = isLesson ? "学びとして残しました。" : "残しました。";
  renderAll();
}

function handlePhoto() {
  const file = photoInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photoData = String(reader.result || "");
    photoPreview.src = photoData;
    photoPreviewWrap.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  photoData = "";
  photoInput.value = "";
  photoPreview.removeAttribute("src");
  photoPreviewWrap.classList.add("hidden");
}

function addFavorite() {
  const input = document.getElementById("favoriteInput");
  const value = input.value.trim();
  if (!value) return;
  state.favorites.push(value);
  input.value = "";
  persist();
  renderFavorites();
}

function removeFavorite(index) {
  state.favorites.splice(index, 1);
  persist();
  renderFavorites();
}

function changeMonth(amount) {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + amount, 1);
  renderCalendar();
}

function setFilter(filter) {
  const button = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
  if (button) setActiveButton(".filter-btn", button);
}

function renderAll() {
  renderHeader();
  renderFavorites();
  renderCalendar();
  renderRecords();
  renderShared();
}

function renderHeader() {
  const postCount = state.records.length;
  const growth = getGrowth(postCount);
  const currentCharacter = document.getElementById("currentCharacter");
  currentCharacter.className = `fuwahare ${growth.className}`;
  currentCharacter.innerHTML = '<span class="face"></span>';
  document.getElementById("growthName").textContent = growth.name;
  document.getElementById("growthCount").textContent = `${postCount}こ投稿で成長中`;

  const todayHasRecord = state.records.some((record) => record.date === toDateKey(TODAY));
  document.getElementById("dailyMessage").textContent = todayHasRecord
    ? "今日も残せています。続けていること、ちゃんと自分の力になっています。"
    : "まだ空っぽでも大丈夫。最初のひとつは、思い出よりも今の気分から始められます。";
}

function getGrowth(count) {
  if (count >= 20) return { name: "まんてんはれ", className: "full" };
  if (count >= 8) return { name: "にじはれ", className: "rainbow" };
  if (count >= 3) return { name: "ふわはれ", className: "middle" };
  return { name: "はれの芽", className: "seed" };
}

function renderFavorites() {
  const wrap = document.getElementById("favoriteChips");
  wrap.innerHTML = "";
  state.favorites.forEach((favorite, index) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span>${escapeHtml(favorite)}</span>`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "×";
    button.setAttribute("aria-label", `${favorite}を削除`);
    button.addEventListener("click", () => removeFavorite(index));
    chip.appendChild(button);
    wrap.appendChild(chip);
  });
}

function renderCalendar() {
  document.getElementById("monthLabel").textContent = `${calendarMonth.getFullYear()}年 ${calendarMonth.getMonth() + 1}月`;
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-btn";
    button.textContent = date.getDate();
    button.dataset.date = key;
    if (date.getMonth() !== calendarMonth.getMonth()) button.classList.add("outside");
    if (key === selectedDate) button.classList.add("selected");
    if (state.records.some((record) => record.date === key)) button.classList.add("has-record");
    button.addEventListener("click", () => {
      selectedDate = key;
      renderCalendar();
      renderRecords();
    });
    grid.appendChild(button);
  }
}

function renderRecords() {
  const filter = document.querySelector(".filter-btn.active")?.dataset.filter || "all";
  const list = document.getElementById("recordsList");
  const records = state.records.filter((record) => {
    const dateMatches = record.date === selectedDate;
    const filterMatches = filter === "all" || record.type === filter;
    return dateMatches && filterMatches;
  });

  list.innerHTML = "";
  if (!records.length) {
    list.innerHTML = '<p class="empty">この日のきろくはまだありません。</p>';
    return;
  }

  records.forEach((record) => {
    const card = document.createElement("article");
    card.className = "record-card";
    const tag = getTypeLabel(record.type);
    card.innerHTML = `
      <div class="record-top">
        <span class="tag">${tag}</span>
        <time datetime="${record.createdAt}">${formatDate(record.createdAt)}</time>
      </div>
      <p>${escapeHtml(record.text)}</p>
    `;
    if (record.photo) {
      const image = document.createElement("img");
      image.src = record.photo;
      image.alt = "記録に添えた写真";
      card.appendChild(image);
    }
    list.appendChild(card);
  });
}

function renderShared() {
  const list = document.getElementById("sharedList");
  list.innerHTML = "";
  state.shared.forEach((item) => {
    const article = document.createElement("article");
    article.className = "shared-item";
    article.innerHTML = `<p>${escapeHtml(item.text)}</p>`;
    list.appendChild(article);
  });
}

function getTypeLabel(type) {
  return {
    happy: "嬉しい",
    fun: "楽しい",
    lesson: "学び"
  }[type] || "きろく";
}

function updateCharCount() {
  charCount.textContent = `${moodText.value.length}/160`;
}

function clearNotice() {
  saveNotice.textContent = "";
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
