import definitions from 'parse-server/lib/cli/definitions/parse-server';

/*
Patch cli/parse-server definitions.
*/

// Use `appPath` instead of `appId` and `appName`.
definitions.appPath = {
  env: "PARSE_SERVER_APPLICATION_PATH",
  help: "Parse application path"
};

// Use `cloud` as a relative path to cloud folder.
definitions.cloud = {
  env: "PARSE_SERVER_CLOUD_CODE_MAIN",
  help: "Cloud code main relative to your cloud path, defaults to main.js",
  default: "main.js"
};

export default definitions;
