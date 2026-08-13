import "./style.css";
import { animate, press } from "motion";
import { bindTilt, grainCss, reducedMotion } from "./studio";

type Stroke = { t: "rake"; pts: number[] } | { t: "stone" | "leaf"; x: number; y: number };
type Tool = "rake" | "stone" | "leaf";

const canvas = document.querySelector<HTMLCanvasElement>("#sand")!;
const ctx = canvas.getContext("2d")!;
const ceremony = document.querySelector<HTMLElement>("#ceremony")!;
let tool: Tool = "rake";
let strokes: Stroke[] = [];
let current: number[] = [];
let drawing = false;

function size() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  paint();
}

function sandFill() {
  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;
  ctx.fillStyle = "#cbb99a";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(80,60,30,0.08)";
  for (let i = 0; i < 1200; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
  }
}

function drawStroke(s: Stroke) {
  if (s.t === "rake") {
    ctx.strokeStyle = "rgba(90,70,40,0.35)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < s.pts.length; i += 2) {
      const x = s.pts[i];
      const y = s.pts[i + 1];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(245,230,200,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < s.pts.length; i += 2) {
      const x = s.pts[i];
      const y = s.pts[i + 1] - 3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (s.t === "stone") {
    ctx.fillStyle = "#4a453c";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 16, 11, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b655a";
    ctx.beginPath();
    ctx.ellipse(s.x - 4, s.y - 3, 6, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#5f7a45";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 10, 18, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paint() {
  sandFill();
  for (const s of strokes) drawStroke(s);
}

function pos(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pos(e);
  if (tool === "rake") {
    drawing = true;
    current = [p.x, p.y];
    canvas.setPointerCapture(e.pointerId);
  } else {
    strokes.push({ t: tool, x: p.x, y: p.y });
    paint();
    save();
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const p = pos(e);
  current.push(p.x, p.y);
  paint();
  drawStroke({ t: "rake", pts: current });
});

canvas.addEventListener("pointerup", () => {
  if (drawing && current.length > 3) {
    const pts = current.filter((_, i) => i % 4 < 2);
    strokes.push({ t: "rake", pts });
    save();
  }
  drawing = false;
  current = [];
  paint();
});

function save() {
  const slim = strokes.slice(-80);
  location.hash = btoa(unescape(encodeURIComponent(JSON.stringify(slim)))).replaceAll("=", "");
}

function load() {
  const h = location.hash.slice(1);
  if (!h) return;
  try {
    const pad = h + "=".repeat((4 - (h.length % 4)) % 4);
    strokes = JSON.parse(decodeURIComponent(escape(atob(pad))));
  } catch {
    strokes = [];
  }
}

for (const b of document.querySelectorAll<HTMLButtonElement>("[data-tool]")) {
  b.addEventListener("click", () => {
    tool = b.dataset.tool as Tool;
    document.querySelectorAll("[data-tool]").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
  });
}

document.querySelector("#share")!.addEventListener("click", async () => {
  save();
  const url = location.href;
  if (navigator.share) await navigator.share({ title: "Rake", url });
  else await navigator.clipboard.writeText(url);
});

document.querySelector("#reset")!.addEventListener("click", () => {
  ceremony.hidden = false;
  setTimeout(() => {
    strokes = [];
    location.hash = "";
    paint();
    ceremony.hidden = true;
  }, 1600);
});

function mountGrain(opacity: number): void {
  const css = document.createElement("style");
  css.textContent = grainCss(opacity);
  document.head.append(css);
  const el = document.createElement("div");
  el.className = "studio-grain";
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
}

function mountStudio(): void {
  bindTilt(document.querySelector("header"), 6, 10);
  mountGrain(0.08);
  if (reducedMotion()) return;
  const tray = document.querySelector<HTMLElement>(".tray");
  const head = document.querySelector<HTMLElement>("header");
  if (head) void animate(head, { opacity: [0, 1], transform: ["translateY(-10px)", "translateY(0px)"] }, { duration: 0.65 });
  if (tray) void animate(tray, { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] }, { duration: 0.8, delay: 0.08 });
  press("nav button", (el) => {
    animate(el, { scale: 0.96 }, { duration: 0.1 });
    return () => animate(el, { scale: 1 }, { duration: 0.2 });
  });
}

addEventListener("resize", size);
load();
size();
mountStudio();
