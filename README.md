# SYZOJ 3
The new version of SYZOJ, in TypeScript.

# Deploy
This project is now heavily under development, you can deploy a development environment easily.

Install MongoDB.

```bash
sudo apt install mongodb-server
```

We use a modified version of [routing-controllers](https://github.com/typestack/routing-controllers). Clone it and install then link it to this project's directory.

```bash
# git clone https://url.of.routing-controllers/
cd routing-controllers
yarn
yarn link
```

Clone this repo and install dependencies.

```bash
# git clone https://url.of.this.repo/
cd syzoj-v3
yarn
yarn link routing-controllers
```

Now you can start it. You can replace `~/.syzoj-debug-config.json` with another path. If the file doesn't exist, it will be created automatically.

```bash
yarn run dev --config ~/.syzoj-debug-config.json
```

If you are editing files and want the server to restart after edited, use `dev-watch` instead of `dev`.

```bash
yarn run dev-watch --config ~/.syzoj-debug-config.json
```

# Unit Tests
This project contains some unit tests, you should start server with `--test-mode` (or `-t`) to enable some test-ralated features. Notice that under test mode it's allowed to drop database or grant a user admin privilege, so don't use it in a production or normal debugging environment.

In order to prevent test mode from being enabled accidentally, test mode can only be started with a database whose name starts with `test_`! So it's recommended to use a different configuration file for tests.

```bash
yarn run dev --config ~/.syzoj-test-config.json --test-mode
```

In another console, run the tests with:

```bash
yarn run test
```
