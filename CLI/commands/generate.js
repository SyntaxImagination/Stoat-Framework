const path      = require("path");
const fs        = require("fs");
const templates = require("../lib/templates");
const { writeFile } = require("../lib/scaffold");

function buildSchemaStub(name, engine) {
    const title = name.charAt(0).toUpperCase() + name.slice(1);

    if (engine === "ClickHouse") {
        return JSON.stringify([{
            name:    name,
            engine:  "MergeTree()",
            orderBy: "created_at",
            columns: [
                { name: "id",         type: "UUID"     },
                { name: "name",       type: "String"   },
                { name: "created_at", type: "DateTime" },
            ],
        }], null, 4);
    }

    if (engine === "CouchDB") {
        return JSON.stringify([{
            name:    name,
            indexes: [
                { name: "name-index", fields: ["name"] },
            ],
        }], null, 4);
    }

    if (engine === "Redis") {
        return JSON.stringify([{
            name:       name,
            keyPrefix:  `${name}:`,
            defaultTTL: 3600,
        }], null, 4);
    }

    if (engine === "QuestDB") {
        return JSON.stringify([{
            name:    name,
            columns: [
                { name: "ts",   type: "TIMESTAMP" },
                { name: "name", type: "SYMBOL"    },
            ],
        }], null, 4);
    }

    // Default — MongoDB / MySQL / MariaDB / PostgreSQL
    return JSON.stringify([{
        name:      title,
        structure: {
            name:      { type: "String", required: true },
            createdAt: { type: "Date",   default: "Date.now" },
        },
    }], null, 4);
}

const USAGE = `
  Usage:
    stoat generate <type> <name>
    stoat g <type> <name>

  Types:
    controller  (c)   Generate a controller class
    model       (m)   Generate a model schema stub

  Examples:
    stoat generate controller users
    stoat g c products
    stoat g m users
`;

module.exports = function generate(args) {
    const type = args[0];
    const name = args[1];

    if (!type || !name) {
        console.log(USAGE);
        process.exit(1);
    }

    // Detect whether the project uses TypeScript by checking for tsconfig.json
    const cwd  = process.cwd();
    const isTs = fs.existsSync(path.join(cwd, "tsconfig.json"));
    const ext  = isTs ? "ts" : "js";

    // Detect version prefix from bin/.config (default v1)
    let version = "v1";
    try {
        const cfg = JSON.parse(fs.readFileSync(path.join(cwd, "bin", ".config"), "utf-8"));
        version   = cfg.app?.api?.versionPrefix?.[0] || "v1";
    } catch (_) {}

    switch (type) {
        case "controller":
        case "c": {
            const dest    = path.join(cwd, "Engine", version, `${name}.${ext}`);
            const content = isTs
                ? templates.controllerTs(name)
                : templates.controllerJs(name);

            if (fs.existsSync(dest)) {
                console.error(`  Controller already exists: Engine/${version}/${name}.${ext}`);
                process.exit(1);
            }

            writeFile(dest, content);
            console.log(`  Created  Engine/${version}/${name}.${ext}`);
            break;
        }

        case "model":
        case "m": {
            const schemaDir  = path.join(cwd, "Models", "Schemas");
            const schemaPath = path.join(schemaDir, `${name}.json`);

            if (fs.existsSync(schemaPath)) {
                console.error(`  Schema already exists: Models/Schemas/${name}.json`);
                process.exit(1);
            }

            // Detect engine from bin/.config to generate the right schema shape
            let engine = "MongoDB";
            try {
                const cfg = JSON.parse(fs.readFileSync(path.join(cwd, "bin", ".config"), "utf-8"));
                engine = cfg.db?.[0]?.engine || "MongoDB";
            } catch (_) {}

            const schemaContent = buildSchemaStub(name, engine);
            writeFile(schemaPath, schemaContent);
            console.log(`  Created  Models/Schemas/${name}.json  (engine: ${engine})`);
            break;
        }

        default:
            console.error(`  Unknown type: ${type}`);
            console.log(USAGE);
            process.exit(1);
    }
};
