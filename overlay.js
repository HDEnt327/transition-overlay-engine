async function loadScene() {
  const response = await fetch("scene.json");
  if (!response.ok) {
    throw new Error(`Failed to load scene.json: ${response.status}`);
  }
  return await response.json();
}

function applyCanvasSettings(canvas, scene) {
  const width = scene.canvas?.width ?? 1920;
  const height = scene.canvas?.height ?? 1080;
  const background = scene.canvas?.background ?? "transparent";

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.background = background;
}

function createBaseElement(el) {
  let node;

  switch (el.type) {
    case "text":
      node = document.createElement("div");
      node.className = "overlay-element overlay-text";
      node.textContent = el.content?.text ?? "";
      break;

    case "image":
      node = document.createElement("img");
      node.className = "overlay-element overlay-image";
      node.src = el.content?.src ?? "";
      node.alt = el.id ?? "";
      node.style.objectFit = el.content?.fit ?? "contain";
      break;

    case "rect":
      node = document.createElement("div");
      node.className = "overlay-element overlay-rect";
      break;

    default:
      throw new Error(`Unsupported element type: ${el.type}`);
  }

  return node;
}

function applySharedStyles(node, el) {
  node.style.left = `${el.x ?? 0}px`;
  node.style.top = `${el.y ?? 0}px`;
  node.style.width = `${el.width ?? 100}px`;
  node.style.height = `${el.height ?? 100}px`;
  node.style.zIndex = String(el.zIndex ?? 0);
  node.style.opacity = String(el.opacity ?? 1);
  node.style.setProperty("--target-opacity", String(el.opacity ?? 1));

  if (el.rotation) {
    node.style.transform = `rotate(${el.rotation}deg)`;
  }
}

function applyTypeStyles(node, el) {
  const style = el.style ?? {};

  if (el.type === "rect") {
    node.style.background = style.fill ?? "transparent";
  }

  if (el.type === "text") {
    node.style.color = style.color ?? "#ffffff";
    node.style.fontFamily = style.fontFamily ?? "Arial, sans-serif";
    node.style.fontSize = `${style.fontSize ?? 32}px`;
    node.style.fontWeight = String(style.fontWeight ?? 400);
    node.style.textAlign = style.align ?? "left";
    node.style.display = "flex";
    node.style.alignItems = "center";
  }

  if (el.type === "image") {
    node.style.display = "block";
  }
}

function animationClassName(type) {
  switch (type) {
    case "fadeIn":
      return "anim-fadeIn";
    case "slideInLeft":
      return "anim-slideInLeft";
    case "slideInDown":
      return "anim-slideInDown";
    case "scaleIn":
      return "anim-scaleIn";
    default:
      return null;
  }
}

function applyAnimations(node, el) {
  const animations = el.animations ?? [];
  if (animations.length === 0) {
    return;
  }

  const first = animations[0];
  const className = animationClassName(first.type);
  if (!className) {
    return;
  }

  node.classList.add("hidden-before-anim");
  node.classList.add(className);
  node.style.animationDelay = `${first.startMs ?? 0}ms`;
  node.style.animationDuration = `${first.durationMs ?? 500}ms`;
  node.style.animationTimingFunction = first.easing ?? "ease-out";
}

function renderScene(scene) {
  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";

  applyCanvasSettings(canvas, scene);

  const elements = [...(scene.elements ?? [])].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );

  for (const el of elements) {
    const node = createBaseElement(el);
    applySharedStyles(node, el);
    applyTypeStyles(node, el);
    applyAnimations(node, el);
    canvas.appendChild(node);
  }
}

async function main() {
  try {
    const scene = await loadScene();
    renderScene(scene);
  } catch (err) {
    console.error(err);
  }
}

main();