## V-Shop


## Table of Content

- [Getting Started](#getting-started)
- [Useful Commands](#useful-commands)
- [VSCode helpers](#vscode-helpers)
- [Misc](#misc)

## Getting started

```bash
npm i
echo "NODE_ENV=development" > .env/.common.env
cp .example.env .env/.development.env
```

Start the project

```bash
pm2 start  ecosystem.config.js
```

## Useful Commands

- `npm start` - starts a dev server with [nodemon](https://github.com/remy/nodemon)
- `npm test` - runs tests with `mocha`
- `npm run generate:module [name]` - generate a new module (Optionnally you can give the name in the command line, otherwise you will be prompted to choose a name.)

## VSCode helpers

### iam

This shortcut will put a definition of new IAM rules in the file.

### iam:route

Will generate a new route

### iam:method

Will generate the definition of a method.

### ctrl

Create new controller.

### module:model

Generate a new mongoose model.

## Misc

To skip loading a module, specify it in the env variable `SKIP_MODULES`

_Example_

```
SKIP_MODULES=modules/devtools,modules/data-browser
```

## Auto depmloyment (Gitlab CI)

You need to define these environment variables in your repository:

- `PRODUCTION_URL`: [The production URL](https://docs.gitlab.com/ee/ci/environments.html#making-use-of-the-environment-url)
- `PRODUCTION_DEPLOY_SERVER`: List of production servers addresses or IP addresses. Should be separated by `,`.
- `PRODUCTION_DEPLOY_PATH`: Where to deploy project on production hosts.
- `PRODUCTION_SSH_PRIVATE_KEY`: The SSH key to use to connect to production servers.
- `STAGING_URL`: [The staging URL](https://docs.gitlab.com/ee/ci/environments.html#making-use-of-the-environment-url)
- `STAGING_DEPLOY_SERVER`: List of staging servers addresses or IP addresses. Should be separated by `,`.
- `STAGING_DEPLOY_PATH`: Where to deploy project on staging hosts.
- `STAGING_SSH_PRIVATE_KEY`: The SSH key to use to connect to staging servers.
