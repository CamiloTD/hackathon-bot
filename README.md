# About this

**NOTE:** My challenge on this repo was not to use **any** library for connecting specifically to any **API**, instead, programming the API classes code in **:base_folder/api**. ¡Go and check the code!


## ¿What's Tellonizer?
*Tellonizer* is a telegram bot that can post issues from [Github](https://github.com) to [Trello](https://trelo.com) boards.

### ¿How does it work?

* [Talk](https://web.telegram.org/#/im?p=@tellonize_bot) with the [tellonize_bot](https://web.telegram.org/#/im?p=@tellonize_bot).

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
		"token": "<your_telegram_bot_token>",
		"watcher": { // Some configs about the telegram loop, you can ignore this if you want
			"delay": 10, // Delay of the watching loop ¿How many time will the bot wait for requesting new updates after one is received? (in milis)
			"start_watching": true, // ¿Must the bot start watching? or should he wait till bot.watch() is called
			"pool_size": 10 // ¿How many messages can the bot fetch at the same time?
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

### The Directory Structure
```batch
api/ <-- API Folder, the connections to remote APIs are programmed in the files inside
	telegram.js <-- Telegram bot library, is basically an EventEmitter that emits commands and messages, and ofc, can reply and send data
	github.js <-- Github API, its designed only for public repos
	trello.js <-- Trello API, has a lot of functions for managing trello boards, lists and cards
classes/usermanager.js <-- User Session Manager
storage/ <-- Small and ultra-simple json data storage
	index.js <-- Exposes .save and .load for storing data in the disk
	users.json <-- Users storage, its created automatically, you can delete this file if you want to reset all users
unit-tests/
	index.js <-- Unitary testing, hooks the /app.js commands and check if they are working correctly as expected
	config.json <-- Setup test parameters here (We recommend you to not to change them, they are configured with my user id and my trello's keys, change it only if you have the fields correctly)
index.js
app.js <-- Exposes Tellonizer app logic, here you can find command definitions and everything else related to bot's logic
config.json
```

