import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = path.resolve(
  process.env.REVIEW_IMAGE_DIR || path.join(__dirname, "..", "public", "azure-images"),
);
const PROCESSED_DIR = path.join(SOURCE_DIR, "processed");
const APPROVED_DIR = path.join(PROCESSED_DIR, "approved");
const NOT_APPROVED_DIR = path.join(PROCESSED_DIR, "not-approved");
const START_PORT = Number(process.env.REVIEW_PORT || process.env.PORT || 4321);
const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

function ensureDirectories() {
  for (const directory of [SOURCE_DIR, APPROVED_DIR, NOT_APPROVED_DIR]) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function isInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function toUrlPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function safeSourcePath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    return null;
  }

  const resolved = path.resolve(SOURCE_DIR, relativePath);

  if (!isInside(resolved, SOURCE_DIR) || isInside(resolved, PROCESSED_DIR)) {
    return null;
  }

  return resolved;
}

function isImage(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function walkImages(directory, images = []) {
  if (!fs.existsSync(directory)) {
    return images;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (absolutePath === PROCESSED_DIR || isInside(absolutePath, PROCESSED_DIR)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkImages(absolutePath, images);
    } else if (entry.isFile() && isImage(entry.name)) {
      const stats = fs.statSync(absolutePath);
      images.push({
        name: entry.name,
        path: toUrlPath(path.relative(SOURCE_DIR, absolutePath)),
        size: stats.size,
        modifiedAt: stats.mtimeMs,
      });
    }
  }

  return images;
}

function countImages(directory) {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  let count = 0;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      count += countImages(absolutePath);
    } else if (entry.isFile() && isImage(entry.name)) {
      count += 1;
    }
  }

  return count;
}

function uniqueDestination(destinationDirectory, fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  let candidate = path.join(destinationDirectory, fileName);
  let suffix = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(destinationDirectory, `${baseName}-${suffix}${extension}`);
    suffix += 1;
  }

  return candidate;
}

async function moveImage(relativePath, decision) {
  const sourcePath = safeSourcePath(relativePath);

  if (!sourcePath || !fs.existsSync(sourcePath) || !isImage(sourcePath)) {
    const error = new Error("Image was not found in the review source directory.");
    error.statusCode = 404;
    throw error;
  }

  const destinationDirectory = decision === "approved" ? APPROVED_DIR : NOT_APPROVED_DIR;
  fs.mkdirSync(destinationDirectory, { recursive: true });

  const destinationPath = uniqueDestination(destinationDirectory, path.basename(sourcePath));

  try {
    await fs.promises.rename(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }

    await fs.promises.copyFile(sourcePath, destinationPath);
    await fs.promises.unlink(sourcePath);
  }

  return toUrlPath(path.relative(SOURCE_DIR, destinationPath));
}

function jsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function htmlResponse(response) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(HTML);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 100_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function contentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function serveImage(response, relativePath) {
  const sourcePath = safeSourcePath(relativePath);

  if (!sourcePath || !fs.existsSync(sourcePath) || !isImage(sourcePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Image not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentType(sourcePath),
    "Cache-Control": "no-store",
  });
  fs.createReadStream(sourcePath).pipe(response);
}

function listResponse(response) {
  const images = walkImages(SOURCE_DIR).sort((a, b) => a.name.localeCompare(b.name));

  jsonResponse(response, 200, {
    sourceDir: SOURCE_DIR,
    processedDir: PROCESSED_DIR,
    approvedDir: APPROVED_DIR,
    notApprovedDir: NOT_APPROVED_DIR,
    images,
    counts: {
      remaining: images.length,
      approved: countImages(APPROVED_DIR),
      notApproved: countImages(NOT_APPROVED_DIR),
    },
  });
}

async function handleDecision(request, response) {
  const body = await readJsonBody(request);
  const relativePath = typeof body.path === "string" ? body.path : "";
  const decision = body.decision === "approved" ? "approved" : "not-approved";
  const movedTo = await moveImage(relativePath, decision);

  jsonResponse(response, 200, { ok: true, decision, movedTo });
}

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Iros Electronics Image Reviewer</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #08111f;
      --panel: rgba(13, 24, 42, 0.82);
      --text: #f7fbff;
      --muted: #9fb1c7;
      --approve: #31e981;
      --reject: #ff5d73;
      --stroke: rgba(255, 255, 255, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      overflow-x: hidden;
      background:
        radial-gradient(circle at top left, rgba(49, 233, 129, 0.18), transparent 30rem),
        radial-gradient(circle at bottom right, rgba(255, 93, 115, 0.18), transparent 32rem),
        var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button {
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .shell {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      gap: 1rem;
      padding: 1rem;
    }

    .topbar,
    .footer {
      width: min(68rem, 100%);
      margin: 0 auto;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--stroke);
      border-radius: 1.3rem;
      background: var(--panel);
      backdrop-filter: blur(18px);
      box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.25);
    }

    h1 {
      margin: 0;
      font-size: clamp(1.1rem, 3vw, 1.75rem);
      letter-spacing: -0.04em;
    }

    .subtitle {
      margin: 0.2rem 0 0;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .stats {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .pill {
      padding: 0.45rem 0.7rem;
      border: 1px solid var(--stroke);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      color: var(--muted);
      font-size: 0.82rem;
      white-space: nowrap;
    }

    .stage {
      display: grid;
      place-items: center;
      min-height: 34rem;
    }

    .deck {
      position: relative;
      width: min(30rem, calc(100vw - 2rem));
      height: min(42rem, calc(100vh - 12rem));
      min-height: 30rem;
      touch-action: none;
    }

    .card,
    .empty {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-rows: 1fr auto;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 2rem;
      background: linear-gradient(145deg, rgba(18, 32, 55, 0.96), rgba(8, 17, 31, 0.94));
      box-shadow: 0 2rem 6rem rgba(0, 0, 0, 0.45);
      user-select: none;
    }

    .card {
      cursor: grab;
      transition: transform 180ms ease, opacity 180ms ease;
      will-change: transform;
    }

    .card.dragging {
      cursor: grabbing;
      transition: none;
    }

    .image-wrap {
      display: grid;
      place-items: center;
      min-height: 0;
      padding: 1rem;
      background:
        linear-gradient(45deg, rgba(255, 255, 255, 0.035) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(255, 255, 255, 0.035) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.035) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.035) 75%);
      background-position: 0 0, 0 0.7rem, 0.7rem -0.7rem, -0.7rem 0;
      background-size: 1.4rem 1.4rem;
    }

    .image-wrap img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 1.25rem;
      object-fit: contain;
      pointer-events: none;
      filter: drop-shadow(0 1rem 1.5rem rgba(0, 0, 0, 0.22));
    }

    .meta {
      display: grid;
      gap: 0.45rem;
      padding: 1rem;
      border-top: 1px solid var(--stroke);
      background: rgba(3, 9, 17, 0.68);
    }

    .filename {
      overflow: hidden;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .path {
      overflow: hidden;
      color: var(--muted);
      font-size: 0.82rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stamp {
      position: absolute;
      top: 1.3rem;
      z-index: 2;
      opacity: 0;
      padding: 0.35rem 0.75rem;
      border: 0.22rem solid currentColor;
      border-radius: 0.6rem;
      font-size: clamp(1.2rem, 4vw, 2rem);
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transform: rotate(-12deg);
      transition: opacity 100ms ease;
    }

    .stamp.approve {
      left: 1.2rem;
      color: var(--approve);
    }

    .stamp.reject {
      right: 1.2rem;
      color: var(--reject);
      transform: rotate(12deg);
    }

    .empty {
      place-items: center;
      grid-template-rows: 1fr;
      padding: 2rem;
      text-align: center;
    }

    .empty h2 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      letter-spacing: -0.05em;
    }

    .empty p {
      margin: 0;
      color: var(--muted);
      line-height: 1.5;
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .action {
      width: 4.5rem;
      height: 4.5rem;
      border: 1px solid var(--stroke);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.22);
      font-size: 1.5rem;
      font-weight: 900;
      transition: transform 130ms ease, background 130ms ease;
    }

    .action:hover {
      transform: translateY(-0.15rem);
      background: rgba(255, 255, 255, 0.13);
    }

    .action.approve {
      color: var(--approve);
    }

    .action.reject {
      color: var(--reject);
    }

    .hint {
      margin-top: 0.8rem;
      color: var(--muted);
      font-size: 0.85rem;
      text-align: center;
    }

    .toast {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      max-width: min(28rem, calc(100vw - 2rem));
      padding: 0.85rem 1rem;
      border: 1px solid var(--stroke);
      border-radius: 1rem;
      background: rgba(3, 9, 17, 0.9);
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.3);
      color: var(--muted);
      opacity: 0;
      transform: translateY(0.5rem);
      transition: opacity 160ms ease, transform 160ms ease;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 720px) {
      .shell {
        padding: 0.7rem;
      }

      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .stats {
        justify-content: flex-start;
      }

      .stage {
        min-height: 30rem;
      }

      .deck {
        height: min(37rem, calc(100vh - 13.5rem));
        min-height: 27rem;
      }

      .action {
        width: 4rem;
        height: 4rem;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div>
        <h1>Iros Electronics Image Reviewer</h1>
        <p class="subtitle">Swipe left to approve. Swipe right to mark not approved.</p>
      </div>
      <div class="stats" aria-live="polite">
        <span class="pill" id="remaining">Remaining: --</span>
        <span class="pill" id="approved">Approved: --</span>
        <span class="pill" id="notApproved">Not approved: --</span>
      </div>
    </header>

    <section class="stage" aria-label="Image review deck">
      <div class="deck" id="deck"></div>
    </section>

    <footer class="footer">
      <div class="actions">
        <button class="action approve" id="approveButton" title="Approve with left arrow" aria-label="Approve">&larr;</button>
        <button class="action reject" id="rejectButton" title="Not approved with right arrow" aria-label="Not approved">&rarr;</button>
      </div>
      <div class="hint">Keyboard: left arrow approves, right arrow marks not approved.</div>
    </footer>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>
    const deck = document.getElementById("deck");
    const approveButton = document.getElementById("approveButton");
    const rejectButton = document.getElementById("rejectButton");
    const remaining = document.getElementById("remaining");
    const approved = document.getElementById("approved");
    const notApproved = document.getElementById("notApproved");
    const toast = document.getElementById("toast");

    let images = [];
    let counts = { remaining: 0, approved: 0, notApproved: 0 };
    let activeCard = null;
    let busy = false;
    let drag = null;
    let toastTimer = null;

    async function loadImages() {
      const response = await fetch("/api/images");

      if (!response.ok) {
        throw new Error("Could not load images.");
      }

      const payload = await response.json();
      images = payload.images;
      counts = payload.counts;
      updateStats();
      renderCard();
    }

    function updateStats() {
      remaining.textContent = "Remaining: " + counts.remaining;
      approved.textContent = "Approved: " + counts.approved;
      notApproved.textContent = "Not approved: " + counts.notApproved;
    }

    function showToast(message) {
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.classList.add("show");
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
    }

    function renderCard() {
      deck.innerHTML = "";
      activeCard = null;

      if (!images.length) {
        deck.innerHTML = '<div class="empty"><div><h2>All reviewed</h2><p>No unprocessed images are left in the source folder.</p></div></div>';
        return;
      }

      const image = images[0];
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = [
        '<div class="stamp approve">Approve</div>',
        '<div class="stamp reject">Not Approved</div>',
        '<div class="image-wrap">',
        '<img src="/image?path=' + encodeURIComponent(image.path) + '" alt="' + escapeHtml(image.name) + '" draggable="false" />',
        '</div>',
        '<div class="meta">',
        '<div class="filename">' + escapeHtml(image.name) + '</div>',
        '<div class="path">' + escapeHtml(image.path) + '</div>',
        '</div>',
      ].join("");

      card.addEventListener("pointerdown", startDrag);
      deck.appendChild(card);
      activeCard = card;
    }

    function escapeHtml(value) {
      return value.replace(/[&<>'"]/g, (character) => {
        if (character === "&") return "&amp;";
        if (character === "<") return "&lt;";
        if (character === ">") return "&gt;";
        if (character === "'") return "&#39;";
        return "&quot;";
      });
    }

    function startDrag(event) {
      if (busy || !activeCard) {
        return;
      }

      activeCard.setPointerCapture(event.pointerId);
      activeCard.classList.add("dragging");
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: 0,
        y: 0,
      };

      activeCard.addEventListener("pointermove", moveDrag);
      activeCard.addEventListener("pointerup", endDrag, { once: true });
      activeCard.addEventListener("pointercancel", cancelDrag, { once: true });
    }

    function moveDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId || !activeCard) {
        return;
      }

      drag.x = event.clientX - drag.startX;
      drag.y = event.clientY - drag.startY;
      applyDrag(drag.x, drag.y);
    }

    function applyDrag(x, y) {
      const rotate = x / 18;
      const approveOpacity = Math.min(Math.max(-x / 120, 0), 1);
      const rejectOpacity = Math.min(Math.max(x / 120, 0), 1);

      activeCard.style.transform = "translate(" + x + "px, " + y + "px) rotate(" + rotate + "deg)";
      activeCard.querySelector(".stamp.approve").style.opacity = approveOpacity;
      activeCard.querySelector(".stamp.reject").style.opacity = rejectOpacity;
    }

    function endDrag(event) {
      if (!drag || event.pointerId !== drag.pointerId || !activeCard) {
        return;
      }

      activeCard.classList.remove("dragging");
      activeCard.removeEventListener("pointermove", moveDrag);

      const x = drag.x;
      drag = null;

      if (Math.abs(x) < 110) {
        resetCard();
        return;
      }

      decide(x < 0 ? "approved" : "not-approved");
    }

    function cancelDrag() {
      if (!activeCard) {
        return;
      }

      activeCard.classList.remove("dragging");
      activeCard.removeEventListener("pointermove", moveDrag);
      drag = null;
      resetCard();
    }

    function resetCard() {
      if (!activeCard) {
        return;
      }

      activeCard.style.transform = "";
      activeCard.querySelector(".stamp.approve").style.opacity = 0;
      activeCard.querySelector(".stamp.reject").style.opacity = 0;
    }

    async function decide(decision) {
      if (busy || !images.length || !activeCard) {
        return;
      }

      busy = true;
      const image = images[0];
      const direction = decision === "approved" ? -1 : 1;

      activeCard.style.transform = "translate(" + (direction * window.innerWidth) + "px, -1rem) rotate(" + (direction * 18) + "deg)";
      activeCard.style.opacity = "0";

      try {
        const response = await fetch("/api/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: image.path, decision }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Could not move image.");
        }

        images.shift();
        counts.remaining = Math.max(counts.remaining - 1, 0);

        if (decision === "approved") {
          counts.approved += 1;
          showToast("Approved: " + image.name);
        } else {
          counts.notApproved += 1;
          showToast("Not approved: " + image.name);
        }

        updateStats();
        renderCard();
      } catch (error) {
        showToast(error.message);
        resetCard();
      } finally {
        busy = false;
      }
    }

    approveButton.addEventListener("click", () => decide("approved"));
    rejectButton.addEventListener("click", () => decide("not-approved"));
    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        decide("approved");
      }

      if (event.key === "ArrowRight") {
        decide("not-approved");
      }
    });

    loadImages().catch((error) => {
      deck.innerHTML = '<div class="empty"><div><h2>Could not start</h2><p>' + escapeHtml(error.message) + '</p></div></div>';
      showToast(error.message);
    });
  </script>
</body>
</html>`;

ensureDirectories();

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");

    if (request.method === "GET" && url.pathname === "/") {
      htmlResponse(response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/images") {
      listResponse(response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/image") {
      serveImage(response, url.searchParams.get("path") || "");
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/decision") {
      await handleDecision(request, response);
      return;
    }

    jsonResponse(response, 404, { error: "Not found" });
  } catch (error) {
    jsonResponse(response, error.statusCode || 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, "0.0.0.0", () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`Image reviewer running at http://localhost:${actualPort}`);
    console.log(`Review source: ${SOURCE_DIR}`);
    console.log(`Approved: ${APPROVED_DIR}`);
    console.log(`Not approved: ${NOT_APPROVED_DIR}`);
  });
}

listen(Number.isFinite(START_PORT) ? START_PORT : 4321);
