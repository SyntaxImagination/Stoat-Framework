#!/usr/bin/env node

const args    = process.argv.slice(2);
const command = args[0];
const rest    = args.slice(1);

const HELP = `
  Stoat CLI — v1.7.0

  Usage:
    stoat <command> [options]

  Commands:
    init                  Scaffold a new Stoat project
    generate <type> <name>  Generate a controller or model
      Types: controller (c), model (m)

  Examples:
    stoat init
    stoat generate controller users
    stoat generate model users
    stoat g c users
`;

switch (command) {
    case "init":
        require("../commands/init")(rest);
        break;

    case "generate":
    case "g":
        require("../commands/generate")(rest);
        break;

    case "--help":
    case "-h":
    case undefined:
        console.log(HELP);
        break;

    default:
        console.error(`  Unknown command: ${command}\n  Run "stoat --help" for usage.\n`);
        process.exit(1);
}
