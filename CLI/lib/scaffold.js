const fs   = require("fs");
const path = require("path");

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

/** Recursively copy a directory. Skips entries that don't exist. */
function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    ensureDir(dest);

    fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
        const srcPath  = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    });
}

module.exports = { ensureDir, writeFile, copyFile, copyDir };
