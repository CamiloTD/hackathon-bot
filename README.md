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
	npm start
```

You can also run the tests with the command:
```batch
	npm test
``` 

Then, open `config.json` file and edit with the following options: