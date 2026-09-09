document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".section, .social-card, .universe-card, .cta").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(18px)";
  el.style.transition = "opacity .7s ease, transform .7s ease";
  observer.observe(el);
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".visible").forEach(el => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
});

const style = document.createElement("style");
style.textContent = ".visible{opacity:1!important;transform:translateY(0)!important}";
document.head.appendChild(style);

// Gentle mouse parallax for the themed decorative elements.
const fx = document.querySelector(".theme-fx");
if (fx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    fx.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
  }, {passive:true});
}

// Animated follower counters.
// Edit each data-count="0" in index.html with the real current count.
const counters = document.querySelectorAll(".counter");
const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count || 0);
    const duration = 1400;
    const start = performance.now();
    const formatter = new Intl.NumberFormat("es-BO");

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatter.format(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    observer.unobserve(el);
  });
}, {threshold:0.6});

counters.forEach(counter => counterObserver.observe(counter));

// Live Kick follower count.
// Kick exposes public channel data containing the current follower total.
// If the browser blocks the direct request, the card falls back gracefully.
async function loadKickFollowers() {
  const el = document.getElementById("kickFollowers");
  if (!el) return;

  try {
    const response = await fetch("https://kick.com/api/v2/channels/lordoflaughtale", {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Kick request failed");
    const data = await response.json();
    const count = Number(data.followers_count ?? data.followersCount);
    if (!Number.isFinite(count)) throw new Error("Follower count unavailable");

    el.textContent = new Intl.NumberFormat("es-BO").format(count);
  } catch (error) {
    // Keep the UI useful even if a browser/network blocks cross-origin requests.
    el.textContent = "Ver en Kick";
    el.title = "No se pudo consultar el contador automáticamente. Pulsa “Ver canal”.";
  }
}
loadKickFollowers();

// Refresh periodically while the page remains open.
setInterval(loadKickFollowers, 5 * 60 * 1000);


// Live/offline Kick status and current viewers.
// The public channel response may include a livestream object while live.
// If the browser blocks the direct request, the UI falls back to the Kick channel.
async function loadKickStatus() {
  const status = document.getElementById("kickStatus");
  const title = document.getElementById("kickStreamTitle");
  const viewers = document.getElementById("kickViewers");
  const category = document.getElementById("kickCategory");
  const dot = document.getElementById("kickStatusDot");
  if (!status || !title || !viewers || !category || !dot) return;

  try {
    const response = await fetch("https://kick.com/api/v2/channels/lordoflaughtale", {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Kick request failed");

    const data = await response.json();
    const stream = data.livestream ?? data.stream ?? null;
    const isLive = Boolean(stream);

    dot.classList.toggle("live", isLive);
    dot.classList.toggle("offline", !isLive);

    if (isLive) {
      status.textContent = "🔴 EN DIRECTO";
      title.textContent =
        stream.session_title ??
        stream.stream_title ??
        stream.title ??
        "Lord of Laughtale está transmitiendo ahora";

      const viewerCount = Number(
        stream.viewer_count ??
        stream.viewerCount ??
        data.viewer_count ??
        data.viewerCount
      );
      viewers.textContent = Number.isFinite(viewerCount)
        ? new Intl.NumberFormat("es-BO").format(viewerCount)
        : "En vivo";

      const categoryName =
        stream.category?.name ??
        stream.category?.title ??
        data.category?.name ??
        data.category?.title ??
        "Kick";
      category.textContent = categoryName;
    } else {
      status.textContent = "⚫ OFFLINE";
      title.textContent = "Ahora mismo no estoy transmitiendo";
      viewers.textContent = "—";
      category.textContent = "—";
    }
  } catch (error) {
    dot.classList.remove("live", "offline");
    status.textContent = "Ver estado en Kick";
    title.textContent = "No se pudo consultar el estado automáticamente";
    viewers.textContent = "—";
    category.textContent = "—";
  }
}

loadKickStatus();
setInterval(loadKickStatus, 2 * 60 * 1000);
