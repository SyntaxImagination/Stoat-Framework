const readline = require("readline");

function ask(rl, label) {
    return new Promise((resolve) => rl.question(label, resolve));
}

/**
 * Runs a sequential list of questions and returns an answers object.
 *
 * Question shape:
 *   { name, message, default?, type?: "input"|"select", choices?: string[] }
 *
 * For "select" questions, choices are printed as a numbered list.
 * Pressing Enter accepts the default (first choice or default value).
 */
async function prompt(questions) {
    const rl = readline.createInterface({
        input:  process.stdin,
        output: process.stdout,
    });

    const answers = {};

    for (const q of questions) {
        if (q.type === "select") {
            const choices = q.choices || [];
            const defaultIdx = q.default !== undefined ? q.default : 0;

            process.stdout.write(`\n  ${q.message}\n`);
            choices.forEach((c, i) => {
                const marker = i === defaultIdx ? ">" : " ";
                process.stdout.write(`  ${marker} [${i + 1}] ${c}\n`);
            });
            process.stdout.write("\n");

            const raw = await ask(rl, `  Choice (default ${defaultIdx + 1}): `);
            const idx = parseInt(raw.trim(), 10);
            const selected =
                isNaN(idx) || idx < 1 || idx > choices.length
                    ? defaultIdx
                    : idx - 1;

            answers[q.name] = { index: selected, value: choices[selected] };
        } else {
            const hint = q.default !== undefined ? ` (${q.default})` : "";
            const raw  = await ask(rl, `  ${q.message}${hint}: `);
            answers[q.name] = raw.trim() || q.default || "";
        }
    }

    rl.close();
    return answers;
}

module.exports = { prompt };
