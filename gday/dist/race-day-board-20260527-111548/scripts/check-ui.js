const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "index.html");
const cssPath = path.join(rootDir, "src", "styles.css");

const html = fs.readFileSync(htmlPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const checks = [];

check("index.html exists", fs.existsSync(htmlPath));
check("styles.css exists", fs.existsSync(cssPath));
check("Viewport meta exists", html.includes('name="viewport"'));
check("External sample data is loaded first", html.indexOf("src/sample-data.js") < html.lastIndexOf("<script>"));
check("Insight panel exists", html.includes('class="insight-panel"'));
check("Coverage note exists", html.includes('id="dataCoverageNote"'));
check("Data intro note exists", html.includes('id="dataIntroNote"'));
check("Coverage status text exists", html.includes("formatCoverageStatusText"));
check("Missing data summary class exists", css.includes(".summary-card.is-missing-data"));
check("Missing coverage day style exists", css.includes(".day-chip.coverage-missing"));
check("Event template exists", html.includes('id="eventTemplate"'));
check("Venue modal exists", html.includes('id="venueModal"'));
check("Mobile breakpoint exists", css.includes("@media (max-width: 760px)"));
check("Insight panel styles exist", css.includes(".insight-panel"));
check("Event card styles exist", css.includes(".event-card"));

const ids = collectIds(html);
const referencedIds = collectReferencedIds(html);
const missingIds = referencedIds.filter((id) => !ids.has(id));
check("All querySelector id references exist", missingIds.length === 0, missingIds.join(", "));

const inlineScripts = collectInlineScripts(html);
check("Inline app script exists", inlineScripts.length > 0, `${inlineScripts.length} script(s)`);
inlineScripts.forEach((script, index) => {
  check(`Inline script ${index + 1} compiles`, scriptCompiles(script));
});

const failed = checks.filter((item) => !item.ok);
checks.forEach((item) => {
  const suffix = item.detail ? ` (${item.detail})` : "";
  console.log(`${item.ok ? "OK" : "NG"} ${item.name}${suffix}`);
});

if (failed.length > 0) {
  console.error(`\nUI check failed: ${failed.length} issue(s)`);
  process.exit(1);
}

console.log(`\nUI check passed: ${checks.length} checks`);

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

function collectIds(value) {
  const ids = new Set();
  const pattern = /\sid="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(value))) {
    ids.add(match[1]);
  }
  return ids;
}

function collectReferencedIds(value) {
  const refs = new Set();
  const pattern = /querySelector\("#([^"]+)"\)/g;
  let match;
  while ((match = pattern.exec(value))) {
    refs.add(match[1]);
  }
  return Array.from(refs).sort();
}

function collectInlineScripts(value) {
  const scripts = [];
  const pattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = pattern.exec(value))) {
    if (match[1].trim()) {
      scripts.push(match[1]);
    }
  }
  return scripts;
}

function scriptCompiles(script) {
  try {
    new vm.Script(script);
    return true;
  } catch (error) {
    return false;
  }
}
