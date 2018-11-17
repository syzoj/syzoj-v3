// Redirect stdout to a log file and call Bootstrap
(async () => {
    const Commander = require("commander");
    const fs = require("fs-extra");
    const child_process = require("child_process");
    const packageInfo = require("./package");
    const Vizion = require("vizion");
    const Moment = require("moment");

    // Check if it's a git version.
    let repoInfo = await new Promise((resolve, reject) => {
        Vizion.analyze(__dirname, (err, meta) => {
            if (err) resolve(null);
            resolve(meta);
        });
    });
    
    let versionString = packageInfo.version;
    let gitVersion = null;
    if (repoInfo && repoInfo.type === "git") {
        gitVersion = `revision ${repoInfo.revision.substr(16)} on ${Moment(repoInfo.update_time).format("YYYY-MM-DD H:mm:ss")}`;
    }

    Commander
        .name(packageInfo.name)
        .usage("--config <file> [--log <file>]")
        .version("v" + versionString + (gitVersion ? ` (Git ${gitVersion})` : ""), "-v, --version")
        .option("-c, --config <file>", "configuration file (if the path don't exist, it will be created automatically)")
        .option("-l, --log <file>", "log file (log will be output to both log file and stdout)")
        .parse(process.argv);

    if (!Commander.config) {
        Commander.help();
    }

    let arguments = {
        config: Commander.config,
        log: Commander.log,
        version: { versionString, gitVersion }
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
    child.stderr.pipe(process.stdout);
    if (stream) {
        child.stdout.pipe(stream);
        child.stderr.pipe(stream);
    }
})();
