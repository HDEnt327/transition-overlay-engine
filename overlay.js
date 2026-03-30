let currentScene = null;
let activeTimers = [];

function clearActiveTimers() {
  for (const timerId of activeTimers) {
    clearTimeout(timerId);
  }
  activeTimers = [];
}

function getSceneFileFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("scene") || "scene.json";
}

async function loadScene(sceneFile) {
  const response = await fetch(sceneFile);
  if (!response.ok) {
    throw new Error(`Failed to load ${sceneFile}: ${response.status}`);
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
  const x = el.x ?? 0;
  const y = el.y ?? 0;
  const width = el.width ?? 100;
  const height = el.height ?? 100;
  const opacity = el.opacity ?? 1;
  const rotation = el.rotation ?? 0;
  const zIndex = el.zIndex ?? 0;

  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
  node.style.zIndex = String(zIndex);
  node.style.opacity = String(opacity);
  node.style.setProperty("--target-opacity", String(opacity));
  node.style.setProperty("--base-rotate", `${rotation}deg`);
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
    node.style.justifyContent =
      style.align === "center"
        ? "center"
        : style.align === "right"
        ? "flex-end"
        : "flex-start";
    node.style.whiteSpace = style.whiteSpace ?? "pre-wrap";
  }

  if (el.type === "image") {
    node.style.display = "block";
  }
}

function getInAnimationPreset(type) {
  switch (type) {
    case "fadeIn":
      return { preClass: "pre-fadeIn", animClass: "anim-fadeIn" };
    case "slideInLeft":
      return { preClass: "pre-slideInLeft", animClass: "anim-slideInLeft" };
    case "slideInDown":
      return { preClass: "pre-slideInDown", animClass: "anim-slideInDown" };
    case "scaleIn":
      return { preClass: "pre-scaleIn", animClass: "anim-scaleIn" };
    default:
      return null;
  }
}

function getOutAnimationClass(type) {
  switch (type) {
    case "fadeOut":
      return "anim-fadeOut";
    case "slideOutLeft":
      return "anim-slideOutLeft";
    case "slideOutDown":
      return "anim-slideOutDown";
    case "scaleOut":
      return "anim-scaleOut";
    default:
      return null;
  }
}

function removeAllAnimationClasses(node) {
  node.classList.remove(
    "pre-fadeIn",
    "pre-slideInLeft",
    "pre-slideInDown",
    "pre-scaleIn",
    "anim-fadeIn",
    "anim-slideInLeft",
    "anim-slideInDown",
    "anim-scaleIn",
    "anim-fadeOut",
    "anim-slideOutLeft",
    "anim-slideOutDown",
    "anim-scaleOut"
  );
}

function setAnimationVariables(node, anim) {
  if (anim?.distance != null) {
    node.style.setProperty("--anim-distance", `${anim.distance}px`);
  } else {
    node.style.setProperty("--anim-distance", "80px");
  }

  if (anim?.fromScale != null) {
    node.style.setProperty("--anim-from-scale", String(anim.fromScale));
  } else {
    node.style.setProperty("--anim-from-scale", "0.8");
  }

  if (anim?.toScale != null) {
    node.style.setProperty("--anim-to-scale", String(anim.toScale));
  } else {
    node.style.setProperty("--anim-to-scale", "0.8");
  }
}

function prepareInAnimation(node, el) {
  const anim = el.animIn;
  if (!anim) return null;

  const preset = getInAnimationPreset(anim.type);
  if (!preset) return null;

  setAnimationVariables(node, anim);
  node.classList.add(preset.preClass);

  return {
    node,
    preClass: preset.preClass,
    animClass: preset.animClass,
    delay: anim.startMs ?? 0,
    duration: anim.durationMs ?? 500,
    easing: anim.easing ?? "ease-out"
  };
}

function scheduleOutAnimation(node, el) {
  const anim = el.animOut;
  if (!anim) return;

  const className = getOutAnimationClass(anim.type);
  if (!className) return;

  const startMs = anim.startMs ?? 0;
  const durationMs = anim.durationMs ?? 500;
  const easing = anim.easing ?? "ease-in";

  const timerId = setTimeout(() => {
    setAnimationVariables(node, anim);
    removeAllAnimationClasses(node);

    node.classList.add(className);
    node.style.animationDelay = "0ms";
    node.style.animationDuration = `${durationMs}ms`;
    node.style.animationTimingFunction = easing;
  }, startMs);

  activeTimers.push(timerId);
}

function renderScene(scene) {
  clearActiveTimers();

  const canvas = document.getElementById("canvas");
  canvas.innerHTML = "";

  applyCanvasSettings(canvas, scene);

  const elements = [...(scene.elements ?? [])].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );

  const pendingInAnimations = [];

  for (const el of elements) {
    const node = createBaseElement(el);
    applySharedStyles(node, el);
    applyTypeStyles(node, el);

    const inAnim = prepareInAnimation(node, el);
    if (inAnim) {
      pendingInAnimations.push(inAnim);
    }

    canvas.appendChild(node);
    scheduleOutAnimation(node, el);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const anim of pendingInAnimations) {
        anim.node.classList.remove(anim.preClass);
        anim.node.classList.add(anim.animClass);
        anim.node.style.animationDelay = `${anim.delay}ms`;
        anim.node.style.animationDuration = `${anim.duration}ms`;
        anim.node.style.animationTimingFunction = anim.easing;
      }
    });
  });
}

function playScene() {
  if (!currentScene) return;
  renderScene(currentScene);
}

async function loadAndPlayScene(sceneFile) {
  currentScene = await loadScene(sceneFile);
  playScene();
}

async function main() {
  try {
    const sceneFile = getSceneFileFromQuery();
    await loadAndPlayScene(sceneFile);

    window.playScene = playScene;
    window.loadAndPlayScene = loadAndPlayScene;
  } catch (err) {
    console.error(err);
  }
}

main();