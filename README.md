
# Tellonizer

  

**NOTE:** My challenge on this repo was not to use **any** library for connecting specifically to any **API**, instead, programming the API classes code in **:base_folder/api**. ¡Go and check the code!

  
  

## ¿What's Tellonizer?

*Tellonizer* is a telegram bot that can post issues from [Github](https://github.com) to [Trello](https://trelo.com) boards.

  
## Features
+ Copy your github issues into a Trello `Backlog` list
+ Every time you run the command **/link**, all cards will automatically updated
+ If an issue is closed
	+ It removes it if it is in the `Backlog` list
	+ It moves it to `Done` if it is in the To Do list
+ Lists the `asignees` to the card if the `github username` or `github email (if public)` is the same of `trello`
+ Lists your github repo's issues
+ List your trello's boards

### ¿How does it work?

  

*  [Talk](https://web.telegram.org/#/im?p=@tellonize_bot) with the [tellonize_bot](https://web.telegram.org/#/im?p=@tellonize_bot).

  

* Write your trello's api_key and token with the command **/setup [api_key] [token]**

* Link a repository to a trello board with the command **/link :owner/:repo**

* Visit your trello's dashboard and *voilá*, a board with te route **:owner/:repo**. You will see that a trello board has been created with the Github issues and assignees inside.

  

### ¿How do i run my own tellonizer?

  

Follow the following steps:

  

```batch

git clone https://github.com/CamiloTD/hackathon-bot.git

cd hackathon-bot

npm install

```

Then, open `config.json` file and edit with your preferred options:

```js

{

    "telegram": {

        "token":  "<your_telegram_bot_token>",

        "watcher": { // Some configs about the telegram loop, you can ignore this if you want

            "delay":  10, // Delay of the watching loop ¿How many time will the bot wait for requesting new updates after one is received? (in milis)

            "start_watching":  true, // ¿Must the bot start watching? or should he wait till bot.watch() is called

            "pool_size":  10  // ¿How many messages can the bot fetch at the same time?

        }
    }
}

```

After configuring the bot, you can start the app with:

```batch

npm start

```

  

You can also run the tests with the command:

```batch

npm test

```

  

## The Logic Behind

In this space, i gonna try to explain you, how is the program architecture and the logic behind the code.

  

### The Code Structure

This is the general folder structure of the code with some info about it:

```js

api/ // API Folder, the connections to remote APIs are programmed in the files inside

    telegram.js  // Telegram bot library, is basically an EventEmitter that emits commands and messages, and ofc, can reply and send data

    github.js  // Github API, its designed only for public repos

    trello.js  // Trello API, has a lot of functions for managing trello boards, lists and cards

classes/usermanager.js  // User Session Manager

storage/ // Small and ultra-simple json data storage

    index.js  // Exposes .save and .load for storing data in the disk

    users.json  // Users storage, its created automatically, you can delete this file if you want to reset all users

unit-tests/

    index.js  // Unitary testing, hooks the /app.js commands and check if they are working correctly as expected

config.json  // Setup test parameters here (I recommend you to not to change them, they are configured with my user id and my trello's keys, change it only if you have the fields correctly)

index.js

app.js  // Exposes Tellonizer app logic, here you can find command definitions and everything else related to bot's logic

config.json

```

  

### The Happy Index.js

  

The magic starts when you run `npm start`, in that moment the `index.js` script will run.

  

`index.js` will require `app.js` that exports instances of three of the main classes of the app

```js

{

    bot, // api/telegram.js instance configured with the /config.js options

    github, // api/github instance, it does not have any specific config

    user_manager, // Bot's session manager from classes/usermanager.js

    exports: { // Command events are exported here

        setup: ([api_key, token], message) =>  "Setup a trello account",

        link: ([ github_repo ], message) =>  "Link a github repo with your trello account",

        issues: ([ github_repo ], message) =>  "Show issues for a given repo",

        myboards: ([], message) =>  "Show your current trello's boards"

    }

}

```

  

Then, it will attach the main events to the bot:

- Prints a success message

- Attach a listener to bot's `command`event for logging the incoming commands

  

## Inside the Commands

  

This bot exposes four basic commands:

+ **/setup [trello-api-key] [trello-token]:**

    + If some parameters are blank, then, ask for them

    + Try to load the trello boards

        + If cannot fetch, writes an `invalid credentials` error to the client then end.

    + Set's up in the session manager

    + Saves the session manager data into the `storage (storage/index.js)`

+ **/link [github_repo (owner/project)]**

    + If github_repo is blank, then, ask for it

    + Try to get repo info

        + If cannot fetch

            + If status is `404`, sends an `invalid repository`error to the client, then end.

            + Sends an `internal error` to the client then end.

    + Get trello's boards and search if some of then exists with the github repo full name

        + If not exists, then create one and notify to the client

    + Create an object `{ backlog, todo, done }` with the `Backlog`, `To Do` and `Done` lists, if some of these files does not exists, then create them

        + If there are other existing lists, it will send a warning to the client encouraging to delete them from the board

    + It will iterate over the repo issues, it will try to get the trello's members from asignees's username and email (if public)

        + If there is not a card with the name of the repo in any of the `standart` lists *(Backlog, To Do, Done)*, then create a card

        + If there is one, then update it

    + It will iterate over the existing cards, and find the cards that **exists in trello, but not in github** (For a closed issue for example). For each card:

        + If the card is in 'Backlog', then remove it

        + If the card is in 'To Do', then move it to 'Done'

    + Sends a success message to the client

+ **/issues [github_repo]**

    + If github_repo is blank, then, ask for it

    + Try to get repo issues

        + If cannot fetch

            + If status is `404`, sends an `invalid repository`error to the client, then end.

            + Else, Sends an `internal error` to the client then end.

    + Sends a list of the issues with its respective urls

+ **/myboards:**

    + Try to get the boards from trello

        + If cannot fetch, then sends a `internal error` to the client, then end.

    + Sends a list of the boards in the format: `name: desc`

  

## Inside the API's Logic

  

The **Github** api, and the **Trello** API are just simple HTTP Apis that get/post/put/delete in promise syntax, you can access the default methods, or run methods with `await api['get'|'post'|'put'|'del']('my/api/method', data)`.

  

The telegram api, is actually a bit more interesting, as it inherits **Event Emitter** for emitting commands and messages from the client.

  

### The Telegram Bot API

  

The telegram bot api has the following components:

+  **token:** Telegram bot's token

+  **info:** Telegram bot info fetched from `this.post('getMe')`

+  **watcher:** Telegram watcher options, see **watcher** below

+  **command_listener:** Event emitter that will store the events related to commands

  

#### How Telegram Bot API handles messages

  

+ The message handling is done by a update loop, that will make a long polling request to the Telegram API and wait for the next updates, when the updates are loaded:

+ It will iterate over the updates, and for each update:

+ If text message starts with "/"

+ Splits the `text.substr(1)`in spaces

+ Emits 'command' event with the created array of parameters

+ Emits an event in **command_listener** Event Emitter **(You can bind events to it using `bot.command('command-name', callback([ arg1, arg2 ... ], telegram_message)`)**

+ Emits an 'update' event with the `telegram_message` object extracted from the `update`

+ After this, it will listen for the next update

  
  

**Note:** If `config.watcher.start_watching === true` then, the update loop will start after construct the object

  

#### Binding command events

  

You can also extend easily and modularly the events by using `bot.command`.

  

For example:

```js

/* A command that replies the first argument and say Yahooo! after it */

bot.command('yahoo', async ([ arg ], msg) =>

await  bot.write(msg.from.id, arg + " Yahoo!")

);

```

  

#### Asking something to the user

In some times, you will need to ask something to the user, the **telegram api** has an async function integrated for it `bot.nextMessage()`

  

For example:

```js

/* A command that ask a word to the user and reply it */

bot.command('repeat', async ([], msg) => {

await  bot.write(msg.from.id, "Hey, please enter a word:");

let { text } = await  bot.nextMessage(msg.from.id);

await  bot.write(msg.from.id, "You have written: " + text);

});

```

  

## The Unit Tests

I must accept that creating this unit testing was one of the biggest challenges on this... challenge.

Testing a bot that is controled remotely was a hard thing to do. I stopped a moment and though **¿What do i want to test?** And i decided to test my 2 main commands and the bot config: **/setup** and **/link**

  
  

**Testing the bot config:**

Here i wanted to test **¿Does the bot initialize and works correctly with the given configuration (config.json)?**

  

For testing that, i just run the `app.js` module with `await App()` and if no errors are thrown, test passes

  

**Testing the /setup command:**

Here i wanted to test if the setup command actually sets up the trello account, for that i get`{ api_key, token }` from `unit-tests/config.json` that will represent some trello keys.

+ It logouts from `test_config.user_id` for ensuring that the user is not configured before the setup starts
+ It sets an `once` listener for the `setup` command and then check:
    + If user session is not created in the `user_manager`, then throws an error
    + If the API Key or the Token are different to the `{ api_key, token }`, then throws an error
    + Else, the test passes

**Testing the /link command:**

Here i wanted to test if the github repo is correctly cloned to the trello account.
For testing that, the program will follow the following algorithm:

+ Gets the `{ github_repo }` from `unit-tests/config.json`
+ Try to load the trello boards
	+ If boards are not loaded, then throw `invalid credentials` error
+ Search and delete the `github_repo.full_name` board if exists
+ Load the boards again
	+ If there is a board with `board.name == github_repo` then throw `Boards are not being deleted correctly` error
+ Executes `app.exports.link([ github_repo ], { from: { id: test_config.user_id }})` and throws any error inside
+ Load the boards
+ Load the github issues
+ Search a board whose `name == github_repo`
	+ If not exists, that means the Board was not created in `app.exports.link(...)` execution, so, throws an `Board is not being created correctly`
+ Get the lists of the repo board
+ Search for the backlog list
	+ If the backlog list does not exists, that means backlog is not being created, then throw `Backlog is not being created`
+ If some of the current issues are not asociated to the board, then throw `${card.name} is not synchronized`
+ Else, test passes
 
### That's all folks!

## Donations

You can help by donating all your stars to this repo :D Good Coding!