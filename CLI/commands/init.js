const path      = require("path");
const { prompt }    = require("../lib/prompt");
const templates = require("../lib/templates");
const { ensureDir, writeFile, copyDir } = require("../lib/scaffold");

// Root of the installed stoatframework package (one level up from CLI/)
const PKG_ROOT = path.join(__dirname, "../../");

const RUNTIMES  = ["Node", "Bun", "Deno"];
const LANGUAGES = ["JavaScript", "TypeScript"];
const DATABASES = ["None", "MongoDB", "MySQL", "MariaDB", "PostgreSQL", "QuestDB", "ClickHouse", "CouchDB", "Redis"];

module.exports = async function init() {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║         Stoat Framework CLI           ║
  ║            stoat init                 ║
  ╚═══════════════════════════════════════╝
`);

    // Phase 1: name + runtime
    const phase1 = await prompt([
        {
            name:    "projectName",
            message: "Project name",
            default: "my-stoat-app",
        },
        {
            name:    "runtime",
            type:    "select",
            message: "Runtime",
            choices: RUNTIMES,
            default: 0,
        },
    ]);

    const projectName = phase1.projectName || "my-stoat-app";
    const runtime     = phase1.runtime.value;  // "Node" | "Bun" | "Deno"
    const isNode      = runtime === "Node";
    const isDeno      = runtime === "Deno";
    const isBun       = runtime === "Bun";

    // Language selection:
    //  - Deno  → TypeScript always (it's the native language)
    //  - Node  → JavaScript only   (TS needs ts-node/tsx — not scaffolded here)
    //  - Bun   → user chooses JS or TS
    let lang = "JavaScript";

    if (isDeno) {
        lang = "TypeScript";
        console.log("  Language: TypeScript (Deno — native)\n");
    } else if (isNode) {
        console.log("  Language: JavaScript (Node.js — TypeScript requires ts-node or tsx)\n");
    } else {
        const phase2 = await prompt([
            {
                name:    "lang",
                type:    "select",
                message: "Language",
                choices: LANGUAGES,
                default: 0,
            },
        ]);
        lang = phase2.lang.value;
    }

    // Phase 3: port + database
    const phase3 = await prompt([
        {
            name:    "port",
            message: "HTTP port",
            default: "5000",
        },
        {
            name:    "db",
            type:    "select",
            message: "Database",
            choices: DATABASES,
            default: 0,
        },
    ]);

    const port      = parseInt(phase3.port, 10) || 5000;
    const db        = phase3.db.value;
    const isTs      = lang === "TypeScript";
    const runtimeId = runtime.toLowerCase();   // "node" | "bun" | "deno"
    const dbKey     = db === "None" ? "none" : db;
    const ext       = isTs ? "ts" : "js";

    const dest = path.join(process.cwd(), projectName);

    console.log(`\n  Scaffolding ${projectName} (${runtime} · ${lang}) …\n`);

    // ── 1. Framework system files (copied from package) ──────────────────────
    copyDir(path.join(PKG_ROOT, "System"),    path.join(dest, "System"));
    copyDir(path.join(PKG_ROOT, "Models"),    path.join(dest, "Models"));
    // StoatCore — fixed v1.1.1 bundled so require("stoatcore") never hits npm v1.0.0
    copyDir(path.join(PKG_ROOT, "StoatCore"), path.join(dest, "StoatCore"));

    // ── 2. Helpers ────────────────────────────────────────────────────────────
    copyDir(path.join(PKG_ROOT, "Helpers"), path.join(dest, "Helpers"));

    // ── 3. Empty directories ──────────────────────────────────────────────────
    ensureDir(path.join(dest, "Engine", "v1"));
    ensureDir(path.join(dest, "Public"));
    ensureDir(path.join(dest, "OtherFiles", "SSL"));
    ensureDir(path.join(dest, "Uploads"));
    ensureDir(path.join(dest, "FlatFiles"));
    ensureDir(path.join(dest, "bin"));

    // ── 4. Entry point ────────────────────────────────────────────────────────
    let entryContent;
    if (isDeno)        entryContent = templates.baseDeno({ name: projectName });
    else if (isTs)     entryContent = templates.baseTs({ name: projectName });
    else               entryContent = templates.baseJs({ name: projectName });

    writeFile(path.join(dest, `base.${ext}`), entryContent);

    // ── 5. runStoatConfig ─────────────────────────────────────────────────────
    writeFile(path.join(dest, "runStoatConfig.js"), templates.runStoatConfig());

    // ── 6. bin/.config ────────────────────────────────────────────────────────
    writeFile(path.join(dest, "bin", ".config"), templates.dotConfig({ port, db: dbKey }));

    // ── 7. Sample controller ──────────────────────────────────────────────────
    const ctrlContent = isTs
        ? templates.controllerTs("home")
        : templates.controllerJs("home");
    writeFile(path.join(dest, "Engine", "v1", `home.${ext}`), ctrlContent);

    // ── 8. Public + misc files ────────────────────────────────────────────────
    writeFile(path.join(dest, "Public", "index.html"),             templates.indexHtml(projectName));
    writeFile(path.join(dest, "Public", "404.html"),               templates.notFoundHtml());
    writeFile(path.join(dest, "OtherFiles", "allowedUrls.txt"),    "http://localhost");

    // ── 9. Runtime config / type files ───────────────────────────────────────
    if (isDeno) {
        // deno.json replaces package.json; tsconfig handled by deno.json compilerOptions
        writeFile(path.join(dest, "deno.json"),    templates.denoJson({ name: projectName, port }));
        writeFile(path.join(dest, "globals.d.ts"), templates.globalsTs());
    } else {
        // Node / Bun
        writeFile(
            path.join(dest, "package.json"),
            templates.packageJson({ name: projectName, runtime: runtimeId, lang: ext }),
        );
        if (isTs) {
            writeFile(path.join(dest, "globals.d.ts"), templates.globalsTs());
            writeFile(path.join(dest, "tsconfig.json"), templates.tsConfig());
        }
    }

    // ── Done ─────────────────────────────────────────────────────────────────
    console.log(`  Done! Your project is ready.\n`);
    console.log(`  Next steps:\n`);
    console.log(`    cd ${projectName}`);

    if (isDeno) {
        console.log(`    deno run --allow-all base.ts\n`);
        console.log(`  (Deno downloads dependencies automatically on first run)\n`);
    } else {
        const installCmd = isBun ? "bun install"  : "npm install";
        const runCmd     = isBun ? `bun run base.${ext}` : "node base.js";
        console.log(`    ${installCmd}`);
        console.log(`    ${runCmd}\n`);
    }
};
