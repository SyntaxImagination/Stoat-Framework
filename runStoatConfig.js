/**
 * Module : runStoatConfig
 * Desc   : Parses bin/.config, loads helpers, seeds _s.__system caches,
 *          builds the startup route map, and runs the package installer.
 */

const log = require("console").log;
const { readFileSync, readdirSync, existsSync, writeFileSync } = require("fs");

function runConfig() {
    /**
     * CONFIG
     */
    let configData    = {};
    let configRawData = readFileSync(`${_s.misc.rootParent}/bin/.config`, "utf-8");

    if (typeof configRawData === "string") {
        configData = JSON.parse(configRawData);
        configData = new Object(configData);
    }

    let neededConfigs = [
        "environment",
        "environmentVariables",
        "baseUrl",
        "app",
        "packages",
        "definitions",
        "appType",
    ];

    let returnConfig = { net: configData.net };

    // Merge top-level config keys
    neededConfigs.forEach((key) => {
        _s.config[key] = configData[key];
    });

    // Ensure environment is set
    if (!_s.config.environment) {
        _s.config.environment = "staging";
    }

    // Paths
    if ("folders" in configData) {
        _s.paths = configData.folders;
    }

    // Database
    if ("db" in configData) {
        _s.dbConfig = configData.db;
    }

    // Request and Response config
    if ("request" in configData) {
        _s.config.requestConf = configData.request;
    }
    if ("response" in configData) {
        _s.config.responseConf = configData.response;
    }

    /**
     * HELPERS
     * Iterate over _s.helpers keys and merge user-defined overrides.
     * Only attempts require() if the file actually exists — avoids confusing
     * "Cannot find module" errors for helpers the user hasn't overridden.
     */
    // Check .js first, fall back to .ts (Bun TS support)
    for (let key in _s.helpers) {
        let helperFile = `${_s.misc.rootPath}/${_s.paths.helpers}/${key}.js`;
        if (!existsSync(helperFile)) {
            helperFile = `${_s.misc.rootPath}/${_s.paths.helpers}/${key}.ts`;
        }

        if (existsSync(helperFile)) {
            try {
                const module = require(helperFile);
                for (let funx in module) {
                    _s.helpers[key][funx] = module[funx];
                }
            } catch (error) {
                log(`HelperError: Failed to load ${key}:`, error.message);
            }
        }
    }

    // Discover and load any extra helper files not in the core set
    const helperDir        = readdirSync(`${_s.misc.rootPath}/${_s.paths.helpers}`);
    const availableHelpers = Object.keys(_s.helpers);

    helperDir.forEach((fileName) => {
        if (!/\.(js|ts)$/.test(fileName)) return;
        const mod = fileName.replace(/\.(js|ts)$/, "");

        if (!availableHelpers.includes(mod) && mod !== "MimeTypes") {
            _s.helpers[mod] = {};
            try {
                const module = require(`${_s.misc.rootPath}/${_s.paths.helpers}/${mod}`);
                for (let funx in module) {
                    _s.helpers[mod][funx] = module[funx];
                }
            } catch (error) {
                log(`HelperError: Failed to load custom helper ${mod}:`, error.message);
            }
        }
    });

    // MimeTypes — extend the core list with user-defined entries
    try {
        const userMimes = require(`${_s.misc.rootPath}/${_s.paths.helpers}/MimeTypes`);
        userMimes.forEach((mime) => _s.__system.mimeTypes.push(mime));
    } catch (error) {
        // No user MimeTypes file — use core defaults only
    }

    /**
     * PERF-1: Cache allowed origins at startup.
     * Reads OtherFiles/allowedUrls.txt once into _s.__system.allowedOrigins.
     * Bind SIGHUP to reload without restarting the process.
     */
    function loadAllowedOrigins() {
        const filePath = `${_s.misc.rootPath}/${_s.paths.others}/allowedUrls.txt`;
        if (!existsSync(filePath)) {
            writeFileSync(filePath, "http://localhost");
        }
        _s.__system.allowedOrigins = readFileSync(filePath, "utf-8")
            .split(/\r?\n/)
            .filter(Boolean);
    }

    loadAllowedOrigins();
    process.on("SIGHUP", loadAllowedOrigins);

    /**
     * PERF-2: Resolve the 404 page path once at startup.
     * Stored in _s.__system.notFoundPage — avoids existsSync() per request.
     */
    const publicPath   = `${_s.misc.rootPath}/${_s.paths.view}`;
    const customErr    = `${publicPath}/${_s.config.responseConf?.notFoundPage || "index.html"}`;
    const fallbackErr  = `${_s.misc.rootPath}/${_s.paths.config}/Public/404.html`;
    _s.__system.notFoundPage = existsSync(customErr) ? customErr : fallbackErr;

    /**
     * PERF-3: Build controller route map at startup.
     * Scans Engine/<version>/ directories and pre-loads all controller modules.
     * Middleware uses _s.__system.routes[version/endpoint] for O(1) lookup
     * instead of constructing file paths and calling require() per request.
     */
    _s.__system.routes = {};
    const engineRoot   = `${_s.misc.rootPath}/${_s.paths.controller}`;
    const versions     = _s.config.app?.api?.versionPrefix || [];

    versions.forEach((version) => {
        const versionDir = `${engineRoot}/${version}`;
        if (!existsSync(versionDir)) return;

        try {
            readdirSync(versionDir).forEach((file) => {
                if (!/\.(js|ts)$/.test(file)) return;
                const name     = file.replace(/\.(js|ts)$/, "");
                const routeKey = `${version}/${name}`;
                try {
                    _s.__system.routes[routeKey] = require(`${versionDir}/${file}`);
                } catch (err) {
                    log(`RouteError: Failed to load controller ${routeKey}:`, err.message);
                }
            });
        } catch (err) {
            log(`RouteError: Cannot read controller directory ${versionDir}:`, err.message);
        }
    });

    /**
     * PACKAGE INSTALLER
     * Verify and auto-install packages listed in bin/.config → "packages"
     */
    const systemPath = `${_s.misc.rootPath}/${_s.paths.config}`;
    const { checkPackage, installPackage } = require(`${systemPath}/App/installer`);

    configData.packages.forEach(async (p) => {
        const found = await checkPackage(p);
        if (!found) installPackage(p);
    });

    return returnConfig;
}

module.exports = { runConfig };
