// Redirect stdout to a log file and call Bootstrap

const Commander = require("commander");
const fs = require("fs-extra");
const child_process = require("child_process");
const packageInfo = require("./package");

Commander
    .name(packageInfo.name)
    .usage("--config <file> [--log <file>]")
    .version(packageInfo.version)
    .option("-c, --config <file>", "Configuration file (If the path don't exist, it will be created automatically)")
    .option("-l, --log <file>", "Log file. Log will be output to both log file and stdout")
    .parse(process.argv);

if (!Commander.config) {
    Commander.help();
}

let arguments = {
    config: Commander.config,
    log: Commander.log
};

let stream = null;
if (arguments.log) {
    try {
        fs.ensureFileSync(arguments.log);
        stream = fs.createWriteStream(arguments.log);
    } catch (e) {
        console.error(`Can't open log file '${arguments.log}' to write - ${e}`);
        process.exit();
    }
}

// To fix 'DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.'
process.execArgv.push("--no-deprecation");
const child = child_process.fork("./node_modules/.bin/ts-node", ["src/Bootstrap", "--", JSON.stringify(arguments)], { silent: true });
child.stdout.pipe(process.stdout);
if (stream) {
    child.stdout.pipe(stream);
}
