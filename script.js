// ============================================================
// Wedding invite — Tường Duy & Như Ngọc
// ============================================================

// Dynamic config — overwritten by data/<side>.json after fetch. The initial
// values are a safe fallback (groom's event) so the page still renders if the
// JSON fails to load.
let CURRENT_SIDE = "";
let WEDDING_DATE = new Date("2026-11-29T18:00:00+07:00");
let CALENDAR_EVENT = {
  title: "Tiệc cưới Tường Duy ❤ Như Ngọc",
  startUtc: "20261129T110000Z",
  endUtc:   "20261129T140000Z",
  location: "Queen Plaza Tân Bình, 91B2 Phạm Văn Hai, Tân Sơn Hòa, Hồ Chí Minh",
  mapsUrl:  "https://maps.app.goo.gl/ytBXpzy8v4EaYTEY6",
  details:  "Trân trọng kính mời quý khách đến chung vui trong ngày cưới của Tường Duy & Như Ngọc.",
};

// ---------- Data: load per-side JSON and apply to DOM ----------
(() => {
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  const applyAttrSpec = (el, spec, data) => {
    spec.split("|").forEach((pair) => {
      const idx = pair.indexOf(":");
      if (idx < 0) return;
      const attr = pair.slice(0, idx).trim();
      const path = pair.slice(idx + 1).trim();
      const v = get(data, path);
      if (v != null) el.setAttribute(attr, v);
    });
  };

  const applyActiveCalendarDay = (data) => {
    const target = String(get(data, "date.day") ?? "").trim();
    if (!target) return;
    const cells = document.querySelectorAll(".cal-day");
    const current = document.querySelector(".cal-day.active");
    let heartHtml = "";
    if (current) {
      const heart = current.querySelector(".cal-heart");
      if (heart) heartHtml = heart.outerHTML;
    }
    cells.forEach((cell) => {
      const label = cell.textContent.replaceAll(/\s+/g, "").trim();
      if (label === target) {
        cell.classList.add("active");
        const monthNum = (get(data, "date.monthShort") || "").match(/\d+/)?.[0] || "";
        const year = get(data, "date.year") || "";
        cell.setAttribute("aria-label", `Ngày cưới ${target} tháng ${monthNum} năm ${year}`);
        if (!cell.querySelector(".cal-heart") && heartHtml) {
          cell.insertAdjacentHTML("afterbegin", heartHtml);
        }
      } else if (cell.classList.contains("active")) {
        cell.classList.remove("active");
        const h = cell.querySelector(".cal-heart");
        if (h) h.remove();
      }
    });
  };

  const applySchedule = (data) => {
    const list = document.getElementById("schTimeline");
    const col = document.getElementById("scheduleCol");
    if (!list || !Array.isArray(data.schedule)) return;
    if (col) {
      col.classList.remove("schedule-groom", "schedule-bride");
      if (data.side === "bride") col.classList.add("schedule-bride");
      else col.classList.add("schedule-groom");
    }
    list.innerHTML = data.schedule.map((item) => {
      const [h, m] = String(item.time ?? "").split(":");
      return `
        <li class="sch-item">
          <span class="sch-time">${h ?? ""}<span class="sch-colon">:</span>${m ?? ""}</span>
          <div class="sch-body">
            <h4 class="sch-event">${item.event ?? ""}</h4>
            ${item.note ? `<p class="sch-note">${item.note}</p>` : ""}
          </div>
        </li>`;
    }).join("");
  };

  const applyRestaurantNameModifier = (data) => {
    const el = document.getElementById("restaurantName");
    if (!el) return;
    const mod = get(data, "venue.nameModifier") || "";
    // Strip any previously-applied modifier (anything starting with restaurant-name--).
    el.classList.forEach((c) => {
      if (c.startsWith("restaurant-name--")) el.classList.remove(c);
    });
    if (mod) mod.split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
  };

  const apply = (data) => {
    document.querySelectorAll("[data-f]").forEach((el) => {
      const v = get(data, el.dataset.f);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-fh]").forEach((el) => {
      const v = get(data, el.dataset.fh);
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-fa]").forEach((el) => {
      applyAttrSpec(el, el.dataset.fa, data);
    });

    applyActiveCalendarDay(data);
    applyRestaurantNameModifier(data);
    applySchedule(data);

    const coupleGrid = document.getElementById("coupleGrid");
    if (coupleGrid) coupleGrid.classList.toggle("couple-grid--reverse", data.side === "bride");

    if (data.date?.iso) WEDDING_DATE = new Date(data.date.iso);
    if (data.calendar) {
      CALENDAR_EVENT = {
        title:    data.calendar.title    ?? CALENDAR_EVENT.title,
        startUtc: data.calendar.startUtc ?? CALENDAR_EVENT.startUtc,
        endUtc:   data.calendar.endUtc   ?? CALENDAR_EVENT.endUtc,
        location: data.calendar.location ?? CALENDAR_EVENT.location,
        mapsUrl:  data.venue?.mapsUrl    ?? CALENDAR_EVENT.mapsUrl,
        details:  data.calendar.details  ?? CALENDAR_EVENT.details,
      };
      refreshCalendarHref();
    }
  };

  fetch("side.txt", { cache: "no-cache" })
    .then((r) => r.ok ? r.text() : Promise.reject(new Error(`side.txt HTTP ${r.status}`)))
    .then((text) => {
      CURRENT_SIDE = text.trim();
      const side = CURRENT_SIDE.toLowerCase().startsWith("b") ? "bride" : "groom";
      return fetch(`data/${side}.json`, { cache: "no-cache" });
    })
    .then((r) => r.ok ? r.json() : Promise.reject(new Error(`JSON HTTP ${r.status}`)))
    .then(apply)
    .catch((e) => console.warn("Config load failed", e));
})();

// ---------- Loader ----------
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => loader.classList.add("hide"), 500);
});

// ---------- Cover letter → open & start music ----------
(() => {
  const cover = document.getElementById("cover");
  const openBtn = document.getElementById("coverOpen");
  if (!cover || !openBtn) return;

  // Lock scroll while the cover is up
  document.body.classList.add("cover-locked");

  const openCover = () => {
    if (cover.classList.contains("is-open")) return;
    cover.classList.add("is-open");
    document.body.classList.remove("cover-locked");

    // The click is a user gesture, so audible playback is allowed from here on.
    const audio = document.getElementById("bgMusic");
    if (audio) {
      audio.muted = false;
      audio.play().catch(() => {});
    }

    // Remove the cover from the DOM after the exit transition finishes
    setTimeout(() => cover.remove(), 1500);
  };

  openBtn.addEventListener("click", openCover);
})();

// ---------- Nav scroll + mobile menu ----------
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
});

navToggle.addEventListener("click", () => {
  navToggle.classList.toggle("open");
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
  });
});

// ---------- Countdown ----------
const dEl = document.querySelector("[data-d]");
const hEl = document.querySelector("[data-h]");
const mEl = document.querySelector("[data-m]");
const sEl = document.querySelector("[data-s]");

function pad(n) { return String(Math.max(0, n)).padStart(2, "0"); }

function setDigit(el, next) {
  if (!el || el.textContent === next) return;
  el.textContent = next;
  el.classList.remove("flip");
  el.getBoundingClientRect();
  el.classList.add("flip");
}

function tick() {
  const now = new Date();
  const diff = WEDDING_DATE - now;
  if (diff <= 0) {
    [dEl, hEl, mEl, sEl].forEach((el) => el && (el.textContent = "00"));
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  setDigit(dEl, pad(days));
  setDigit(hEl, pad(hours));
  setDigit(mEl, pad(mins));
  setDigit(sEl, pad(secs));
}
tick();
setInterval(tick, 1000);

// ---------- Divider draw-in ----------
const dividerObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("drawn");
        dividerObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll(".divider").forEach((d) => dividerObs.observe(d));

// ---------- Scroll reveal ----------
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ---------- Copy to clipboard ----------
function showToast(msg) {
  let t = document.querySelector(".copy-toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "copy-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 1800);
}

function flashCopied(el) {
  el.classList.remove("copied");
  el.getBoundingClientRect();
  el.classList.add("copied");
  clearTimeout(el._copyTimer);
  el._copyTimer = setTimeout(() => el.classList.remove("copied"), 1600);
}

document.querySelectorAll(".copyable").forEach((el) => {
  el.addEventListener("click", async () => {
    const text = el.dataset.copy || el.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Đã sao chép số tài khoản ✓");
      flashCopied(el);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); showToast("Đã sao chép ✓"); flashCopied(el); }
      catch { showToast("Không thể sao chép"); }
      ta.remove();
    }
  });
});

// ---------- Gift box → opening sequence → modal ----------
(() => {
  const gift = document.getElementById("giftbox");
  const confetti = document.getElementById("giftboxConfetti");
  const modal = document.getElementById("giftModal");
  if (!gift || !confetti || !modal) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OPEN_MODAL_AT = 2200;
  const BURST_AT = 1000;
  let busy = false;

  const colors = ["#c99a9a", "#dcb6b6", "#e8cdcb", "#a3b392", "#d6b27c"];
  const heart = '<svg viewBox="0 0 12 11"><path d="M6 11L1 6A3 3 0 0 1 6 1.6A3 3 0 0 1 11 6Z" fill="currentColor"/></svg>';

  function burst() {
    confetti.innerHTML = "";
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("i");
      const kind = ["heart", "petal", "dot"][i % 3];
      el.className = kind;
      if (kind === "heart") el.innerHTML = heart;
      const angle = (-90 + (Math.random() * 150 - 75)) * Math.PI / 180;
      const dist = 80 + Math.random() * 90;
      el.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      el.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      el.style.setProperty("--rot", (Math.random() * 540 - 270) + "deg");
      el.style.setProperty("--delay", Math.random() * 0.25 + "s");
      el.style.setProperty("--c", colors[i % colors.length]);
      confetti.appendChild(el);
    }
  }

  const openGiftModal = () => {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  };
  const closeGiftModal = () => {
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
  };
  const resetGiftBox = () => {
    gift.classList.remove("is-opening");
    confetti.innerHTML = "";
    busy = false;
  };

  gift.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    if (reduce) { setTimeout(openGiftModal, 200); return; }
    gift.classList.add("is-opening");
    setTimeout(burst, BURST_AT);
    setTimeout(openGiftModal, OPEN_MODAL_AT);
  });

  // Close modal via × button, backdrop click, or Esc; reset the box after each close
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { closeGiftModal(); return; }
    if (e.target === modal) closeGiftModal();
  });
  modal.addEventListener("close", resetGiftBox);
})();

// ---------- Wishes (Google Apps Script + Google Sheet) ----------
// Paste your deployed Apps Script Web App URL here. See apps-script.gs for setup.
const WISHES_ENDPOINT = "https://script.google.com/macros/s/AKfycbzTBDfmKz8q36pMvPggvP3XEu6Q2YDWbpicOqrIx_2XUoevIGqJ-C-_ajJ04RE-mWh1WQ/exec";
const WISHES_PAGE_SIZE = 6;

const wishesWall = document.getElementById("wishesWall");
const wishesMoreBtn = document.getElementById("wishesMore");
const wishesCountEl = document.getElementById("wishesCount");

const WISH_ACCENTS = ["var(--sage-500)", "var(--rose)", "var(--terracotta)", "var(--sage-700)"];

let allWishes = [];
let shownWishes = 0;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function relativeTime(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return "vừa xong";
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function updateWishesCount() {
  if (!wishesCountEl) return;
  const n = allWishes.length;
  if (!n) { wishesCountEl.hidden = true; return; }
  wishesCountEl.hidden = false;
  wishesCountEl.innerHTML = `<b>${n}</b> lời chúc yêu thương`;
}

function accentFor(index) {
  return WISH_ACCENTS[((index % WISH_ACCENTS.length) + WISH_ACCENTS.length) % WISH_ACCENTS.length];
}

function buildWishCard(w, { fresh = false, index = 0 } = {}) {
  const card = document.createElement("article");
  card.className = "wish-card" + (fresh ? " is-fresh" : "");
  card.style.setProperty("--accent", accentFor(index));
  card.innerHTML = `
    ${fresh ? '<span class="wish-fresh-badge">Gửi thành công ✓</span>' : ""}
    <p class="wish-text">${escapeHtml(w.wish)}</p>
    <div class="wish-meta">
      <span class="wish-name">${escapeHtml(w.name || "Ẩn danh")}</span>
      <span class="wish-time" data-time="${escapeHtml(w.timestamp || "")}">${escapeHtml(relativeTime(w.timestamp))}</span>
    </div>
  `;
  requestAnimationFrame(() => card.classList.add("in"));
  return card;
}

function renderSkeletons(n = 3) {
  if (!wishesWall) return;
  wishesWall.innerHTML = "";
  const patterns = [
    ["sk-long", "sk-long", "sk-med"],
    ["sk-long", "sk-med"],
    ["sk-long", "sk-long", "sk-long", "sk-short"],
  ];
  for (let i = 0; i < n; i++) {
    const sk = document.createElement("div");
    sk.className = "wish-skeleton";
    const lines = patterns[i % patterns.length]
      .map((cls) => `<span class="sk-line ${cls}"></span>`)
      .join("");
    sk.innerHTML = `${lines}<span class="sk-name"></span>`;
    wishesWall.appendChild(sk);
  }
}

function renderMoreWishes() {
  if (!wishesWall) return;
  const next = allWishes.slice(shownWishes, shownWishes + WISHES_PAGE_SIZE);
  next.forEach((w, i) => wishesWall.appendChild(buildWishCard(w, { index: shownWishes + i })));
  shownWishes += next.length;
  if (wishesMoreBtn) wishesMoreBtn.hidden = shownWishes >= allWishes.length;
}

function renderInitialWishes() {
  if (!wishesWall) return;
  wishesWall.innerHTML = "";
  shownWishes = 0;
  updateWishesCount();
  if (!allWishes.length) {
    const empty = document.createElement("div");
    empty.className = "wishes-state";
    empty.textContent = "Hãy là người đầu tiên gửi lời chúc ✿";
    wishesWall.appendChild(empty);
    if (wishesMoreBtn) wishesMoreBtn.hidden = true;
    return;
  }
  renderMoreWishes();
}

function prependFreshWish(w) {
  if (!wishesWall) return null;
  const empty = wishesWall.querySelector(".wishes-state");
  if (empty) empty.remove();
  allWishes.unshift(w);
  shownWishes += 1;
  const card = buildWishCard(w, { fresh: true, index: 0 });
  wishesWall.prepend(card);
  updateWishesCount();
  // Fade the badge out after a few seconds (CSS handles the transition)
  setTimeout(() => card.classList.add("is-badge-fading"), 4000);
  setTimeout(() => {
    const b = card.querySelector(".wish-fresh-badge");
    if (b) b.remove();
    card.classList.remove("is-badge-fading");
  }, 5000);
  return card;
}

async function fetchWishes() {
  if (!wishesWall) return;
  renderSkeletons(3);
  if (!WISHES_ENDPOINT) {
    wishesWall.innerHTML = "";
    const msg = document.createElement("div");
    msg.className = "wishes-state";
    msg.textContent = "Lời chúc sẽ hiện ra khi được kết nối.";
    wishesWall.appendChild(msg);
    wishesWall.setAttribute("aria-busy", "false");
    return;
  }
  try {
    const res = await fetch(WISHES_ENDPOINT, { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allWishes = Array.isArray(data?.wishes) ? data.wishes : [];
    renderInitialWishes();
  } catch (e) {
    console.warn("Load wishes failed", e);
    wishesWall.innerHTML = "";
    const err = document.createElement("div");
    err.className = "wishes-state";
    err.textContent = "Không tải được lời chúc. Vui lòng thử lại sau.";
    wishesWall.appendChild(err);
  } finally {
    wishesWall.setAttribute("aria-busy", "false");
  }
}

// Refresh relative timestamps every 60s so "vừa xong" / "X phút trước" stay accurate
setInterval(() => {
  document.querySelectorAll(".wish-time[data-time]").forEach((el) => {
    const t = el.dataset.time;
    if (t) el.textContent = relativeTime(t);
  });
}, 60000);

wishesMoreBtn?.addEventListener("click", renderMoreWishes);
fetchWishes();

// ---------- RSVP form ----------
const form = document.getElementById("rsvpForm");
const formSuccess = document.getElementById("formSuccess");
const submitBtn = document.getElementById("rsvpSubmit");
const submitLabel = submitBtn?.querySelector(".btn-label");
const wishInput = document.getElementById("wishInput");
const wishCounter = document.getElementById("wishCounter");

function updateWishCounter() {
  if (!wishInput || !wishCounter) return;
  const max = Number(wishInput.getAttribute("maxlength")) || 500;
  const n = wishInput.value.length;
  wishCounter.textContent = `${n} / ${max}`;
  wishCounter.classList.toggle("is-near", n >= max * 0.8 && n < max);
  wishCounter.classList.toggle("is-max", n >= max);
}
wishInput?.addEventListener("input", updateWishCounter);
updateWishCounter();

const SUBMIT_LABEL_KEYS = { loading: "loading", success: "success" };
function setSubmitState(state) {
  if (!submitBtn) return;
  submitBtn.classList.remove("is-loading", "is-success");
  if (state === "loading") submitBtn.classList.add("is-loading");
  if (state === "success") submitBtn.classList.add("is-success");
  if (submitLabel) {
    const key = SUBMIT_LABEL_KEYS[state] || "default";
    submitLabel.textContent = submitLabel.dataset[key];
  }
}

async function submitRsvp(payload) {
  if (!WISHES_ENDPOINT) {
    console.log("RSVP (no endpoint configured):", payload);
    return { ok: true, offline: true };
  }
  // Apps Script web apps don't send CORS headers for application/json preflight,
  // so send as text/plain to keep the request "simple" and avoid preflight.
  const res = await fetch(WISHES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.side = CURRENT_SIDE;
  const wishText = (data.wish || "").trim();

  if (submitBtn) submitBtn.disabled = true;
  setSubmitState("loading");

  try {
    await submitRsvp(data);
    setSubmitState("success");
    formSuccess.classList.add("show");

    let freshCard = null;
    if (wishText) {
      freshCard = prependFreshWish({
        name: data.name || "Ẩn danh",
        wish: wishText,
        timestamp: new Date().toISOString(),
      });
    }

    // Reset form AFTER capturing the wish for the fresh card
    form.reset();
    updateWishCounter();

    // Scroll to the user's own new card (not just the section) once it exists
    if (freshCard) {
      setTimeout(() => {
        const y = freshCard.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 300);
    }

    // Restore the button after the success flash
    setTimeout(() => setSubmitState("default"), 2200);
    setTimeout(() => formSuccess.classList.remove("show"), 6000);
  } catch (err) {
    console.warn("RSVP submit failed", err);
    showToast("Gửi không thành công, vui lòng thử lại.");
    setSubmitState("default");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

// ---------- Music ----------
(() => {
  const musicBtn = document.getElementById("musicToggle");
  const audio = document.getElementById("bgMusic");
  if (!musicBtn || !audio) return;

  let userPaused = false;

  const syncState = () => {
    musicBtn.classList.toggle("playing", !audio.paused);
    musicBtn.setAttribute(
      "aria-label",
      audio.paused ? "Phát nhạc" : "Tạm dừng nhạc"
    );
  };
  audio.addEventListener("play", syncState);
  audio.addEventListener("pause", syncState);
  syncState();

  musicBtn.addEventListener("click", () => {
    if (audio.paused) {
      userPaused = false;
      audio.play().catch(() => {});
    } else {
      userPaused = true;
      audio.pause();
    }
  });

  // Pause when the tab is hidden; resume on return unless the user paused it.
  // Only auto-resume once the user has actually started the music (i.e. opened
  // the cover) — otherwise `play()` is blocked and shows as an unhandled error.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else if (!userPaused && audio.currentTime > 0) {
      audio.play().catch(() => {});
    }
  });
})();

// ---------- Add to Google Calendar ----------
function refreshCalendarHref() {
  const btn = document.getElementById("addToCalendar");
  if (!btn) return;
  const details = `${CALENDAR_EVENT.details}\n\nBản đồ: ${CALENDAR_EVENT.mapsUrl}`;
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     CALENDAR_EVENT.title,
    dates:    `${CALENDAR_EVENT.startUtc}/${CALENDAR_EVENT.endUtc}`,
    details:  details,
    location: CALENDAR_EVENT.location,
    ctz:      "Asia/Ho_Chi_Minh",
  });
  btn.href = `https://calendar.google.com/calendar/render?${params.toString()}`;
}
refreshCalendarHref();

// ---------- Gallery: render slides from the carousel folder ----------
// Edit this list when photos change in assets/images/gallery-carousel/
const GALLERY_FILES = [
  "1.DSC_7566.jpg",
  "1.DSC_7567.jpg",
  "1.DSC_7615.jpg",
  "1.DSC_7619.jpg",
  "1.DSC_7700.jpg",
  "2.DSC_7329.jpg",
  "2.DSC_7339.jpg",
  "2.DSC_7441.jpg",
  "2.DSC_7458.jpg",
  "2.DSC_7516.jpg",
  "2.DSC_7527.jpg",
  "3.DSC_8331.jpg",
  "3.DSC_8343.jpg",
  "4.DSC_7805.jpg",
  "4.DSC_7912.jpg",
];

(() => {
  const track = document.getElementById("galleryTrack");
  if (!track) return;
  track.innerHTML = GALLERY_FILES.map((file, i) => {
    const src = `assets/images/gallery-carousel/${file}`;
    return `
      <div class="g-slide" data-full="${src}">
        <img data-src="${src}" alt="Khoảnh khắc cưới ${i + 1}" draggable="false" />
      </div>`;
  }).join("");
  initGalleryCarousel();
})();

// ---------- Gallery coverflow carousel + lightbox ----------
function initGalleryCarousel() {
  const carousel = document.getElementById("galleryCarousel");
  if (!carousel) return;
  const track = document.getElementById("galleryTrack");
  const stage = document.getElementById("gcStage") || carousel.querySelector(".gc-stage");
  const slides = Array.from(track.querySelectorAll(".g-slide"));
  const total = slides.length;
  if (!total) return;
  const dotsWrap = document.getElementById("galleryDots");
  if (dotsWrap) dotsWrap.innerHTML = "";
  const prevBtn = carousel.querySelector(".gc-prev");
  const nextBtn = carousel.querySelector(".gc-next");
  const lightbox = document.getElementById("galleryLightbox");
  const lbImg = document.getElementById("galleryLightboxImage");
  const lbCounter = document.getElementById("galleryLightboxCounter");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;

  // Shortest circular offset of slide j from active i (range -floor(n/2)..+floor(n/2))
  const circularD = (j, i) => {
    let d = j - i;
    const half = total / 2;
    if (d > half) d -= total;
    else if (d < -half) d += total;
    return d;
  };

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Go to photo ${i + 1}`);
    b.addEventListener("click", (e) => { e.stopPropagation(); go(i); });
    dotsWrap.appendChild(b);
    return b;
  });

  function applyNaturalRatio(slide, img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    slide.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
  }

  function ensureLoaded(j) {
    const slide = slides[j];
    const img = slide.querySelector("img");
    if (!img) return;
    if (!img.src && img.dataset.src) {
      img.addEventListener("load", () => applyNaturalRatio(slide, img), { once: true });
      img.src = img.dataset.src;
    } else if (img.complete) {
      applyNaturalRatio(slide, img);
    }
  }

  function updateStyles() {
    slides.forEach((slide, j) => {
      const d = circularD(j, index);
      const ad = Math.abs(d);
      const scale = ad === 0 ? 1 : ad === 1 ? 0.85 : 0.7;
      const opacity = ad === 0 ? 1 : ad === 1 ? 0.75 : ad === 2 ? 0.5 : 0.3;
      slide.style.transform =
        `translate(-50%, -50%) translateX(${60 * d}%) translateZ(${-150 * ad}px) rotateY(${45 * d}deg) scale(${scale})`;
      slide.style.opacity = opacity;
      slide.style.zIndex = 100 - ad;
      slide.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    // Eager-load window: active and the two visible cards on each side
    for (let k = -2; k <= 2; k++) ensureLoaded((index + k + total) % total);
    dots.forEach((b, j) => b.setAttribute("aria-current", j === index ? "true" : "false"));
  }

  function go(i) {
    index = ((i % total) + total) % total;
    updateStyles();
  }

  prevBtn?.addEventListener("click", (e) => { e.stopPropagation(); go(index - 1); pauseAuto(); });
  nextBtn?.addEventListener("click", (e) => { e.stopPropagation(); go(index + 1); pauseAuto(); });

  // Clicking a side card activates it; clicking the active card opens the lightbox
  slides.forEach((s, i) => {
    s.addEventListener("click", () => {
      const d = circularD(i, index);
      if (d === 0) openLightbox(i);
      else go(i);
    });
  });

  // Keyboard navigation when the stage is focused
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
  });

  // Touch swipe (horizontal > 40px; keep vertical scroll working)
  let touchX = null, touchY = null, swiping = false;
  stage?.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    touchX = t.clientX; touchY = t.clientY; swiping = false;
    pauseAuto();
  }, { passive: true });
  stage?.addEventListener("touchmove", (e) => {
    if (touchX == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    if (!swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) swiping = true;
  }, { passive: true });
  stage?.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const wasSwiping = swiping;
    touchX = null; touchY = null; swiping = false;
    if (wasSwiping && Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  });

  // Autoplay — paused on hover/touch, when tab is hidden, and under reduced-motion
  const AUTOPLAY_MS = 4000;
  let autoTimer = null;
  let hovered = false;
  const canAutoplay = !reduceMotion;
  function startAuto() {
    if (!canAutoplay || autoTimer || hovered || document.hidden || (lightbox && lightbox.open)) return;
    autoTimer = setInterval(() => go(index + 1), AUTOPLAY_MS);
  }
  function pauseAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  carousel.addEventListener("mouseenter", () => { hovered = true; pauseAuto(); });
  carousel.addEventListener("mouseleave", () => { hovered = false; startAuto(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAuto();
    else startAuto();
  });

  // Lightbox (reuse existing dialog)
  function openLightbox(i) {
    if (!lightbox) return;
    index = ((i + total) % total);
    updateLightbox();
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
    pauseAuto();
  }
  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === "function") lightbox.close();
    else lightbox.removeAttribute("open");
    startAuto();
  }
  function updateLightbox() {
    if (!lightbox) return;
    const slide = slides[index];
    const img = slide.querySelector("img");
    const src = slide.dataset.full || img.dataset.src || img.src;
    lbImg.classList.add("is-loading");
    const next = new Image();
    next.onload = () => { lbImg.src = src; lbImg.classList.remove("is-loading"); };
    next.src = src;
    lbImg.alt = img.alt || "";
    if (lbCounter) lbCounter.textContent = `${index + 1} / ${total}`;
    updateStyles();
  }

  lightbox?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { closeLightbox(); return; }
    if (e.target.closest(".gl-next")) { index = (index + 1) % total; updateLightbox(); return; }
    if (e.target.closest(".gl-prev")) { index = (index - 1 + total) % total; updateLightbox(); return; }
    if (e.target.closest(".gl-image, .gl-counter")) return;
    closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox?.open) return;
    if (e.key === "ArrowRight") { index = (index + 1) % total; updateLightbox(); }
    else if (e.key === "ArrowLeft") { index = (index - 1 + total) % total; updateLightbox(); }
  });

  // Kick off a background prefetch for everything else so dot jumps are instant.
  // The browser caps parallel requests per host, so this won't flood the network.
  const prefetchRest = () => { for (let j = 0; j < total; j++) ensureLoaded(j); };
  if ("requestIdleCallback" in window) requestIdleCallback(prefetchRest, { timeout: 1000 });
  else setTimeout(prefetchRest, 500);

  updateStyles();
  startAuto();
}

// ---------- Smooth scroll offset for fixed nav ----------
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});
