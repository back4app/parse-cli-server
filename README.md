The goal of `parse-cli-server` project is to support `parse-cli` command line tool, providing a simple interface to development and deployment to `parse-server` and enabling BaaS solutions to easily
work with it.

`ParseCliServer` must be mounted in `ParseServer` to easily share their `config` object. The default implementation use only `config.databaseController` and `config.filesController`.

```javascript
let config = AppCache.get(appId);
const cliServer = new ParseCliServer(config, {cloud: options.cloud});
app.use('/1', cliServer.app);
```

Run `ParseServer` with these changes and use [`parse-cli`](https://github.com/ParsePlatform/parse-cli) project to manage your development and deployment lifecycle.

After install `parse-cli`, set the `PARSE_SERVER` environment variable.

```
$ export PARSE_SERVER=http://localhost:1337/1/
$ parse-cli configure accountkey -d
Input your account key or press ENTER to generate a new one.
NOTE: on pressing ENTER we'll try to open the url:
    "https://www.parse.com/account/keys"
in default browser.
Account Key: MASTER_KEY
Note: this operation will overwrite the default account key
Successfully stored default account key.

$ parse-cli new
Would you like to create a new app, or add Cloud Code to an existing app?
Type "(n)ew" or "(e)xisting": e
1:  myapp
Select an App to add to config: 1
Which of these providers would you like use for running your server code:
1) Heroku (https://www.heroku.com)
2) Parse  (https://parse.com/docs/cloudcode/guide)
Type 1 or 2 to make a selection: 2

Please enter the name of the folder where we can download the latest deployed
Cloud Code for your app "myapp"

Directory Name: 

You can either set up a blank project or download the current deployed Cloud Code.
Please type "(b)lank" if you wish to setup a blank project, otherwise press ENTER: 
Successfully downloaded Cloud Code to "myapp".
Successfully configured email for current project to: "myapp@example.com"
```
