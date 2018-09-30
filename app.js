const { telegram } = require('./config.json');
const TelegramBot = require('./api/telegram');
const TrelloAPI = require('./api/trello');
const GithubAPI = require('./api/github');
const UserManager = require('./classes/usermanager');
const Storage = require('./storage');
const colors = require('colors/safe');


module.exports = (async () => {
    const bot = new TelegramBot(telegram);
    const github = new GithubAPI();
    const user_manager = new UserManager(await Storage.load('users'));
    const exports = {};

    await bot.load();
   
    const setup = exports.setup = async ([ api_key, token ], { from }) => {
        if(!api_key) {
            await bot.write(from.id, "Please enter your Trello *API Key*:");
            api_key = (await bot.nextMessage(from.id)).text;
        }

        if(!token) {
            await bot.write(from.id, "Please enter your Trello *Token*:");
            token = (await bot.nextMessage(from.id)).text;
        }

        let trello = new TrelloAPI({ api_key, token });
        let boards;

        try {
            boards = await trello.boards();
        } catch (exc) {
            await bot.write(from.id, `Your credentials seems to be wrong. ¿Why dont you try again? you can get your *api key* and *token* [here](https://trello.com/app-key)`);
            return;
        }

        let user = user_manager.setup(from, api_key, token);
        Storage.save('users', user_manager);

        await bot.write(from.id, `Your trello account has been setted.\nYou can start configuring your workspace, use */help* if you need my... help :D`);
    } 
    const issues = exports.issues = async ([ repo ], { from }) => {
        try {
            let issues = await github.issues(repo);

            await bot.write(from.id, `*${repo} issue list:*`)

            await bot.sendList(from.id, issues.map(({ user, title, number }) => (
                `*${ user.login }:* [${ title }](https://github.com/CamiloTD/hackathon-bot/issues/${number})`
            )));
        } catch (err) {
            if(err.statusCode === 404)
                return await bot.write(from.id, `*${repo}* is not a valid repository.`);
            
            console.log(err);
            return await bot.write(from.id, 'Sorry we had a internal problem... Try again later.');
        }
    };

    const myboards = exports.myboards = async ([], { from }) => {
        let trello = user_manager.trello(from);

        if(!trello)
            return await bot.write(from.id, 'Please setup your keys with */setup <trello api key> <trello token>*');
        
        try {
            let boards = await trello.boards();
            console.log(boards);

            await bot.sendList(from.id, boards.map(({ name, desc }) => (
                `*${name}: * **${desc}**`
            )));
        } catch (err) {
            console.log(err);
            return await bot.write(from.id, 'Sorry we had a internal problem... Try again later.');
        }
    };

    const link = exports.link = async ([ repo, board ], { from }) => {
        if(!repo) {
            await bot.write(from.id, `Please enter the repository in the format *User*/*repo*`);
            repo = (await bot.nextMessage(from.id)).text;
        }

        let github_repo;

        try {
            github_repo = await github.repo(repo);
        } catch (err) {
            if(err.statusCode === 404)
                return await bot.write(from.id, `*${repo}* is not a valid repository.`);
            
            console.log(err);
            return await bot.write(from.id, 'Sorry we had a internal problem... Try again later.');
        }
        
        let board_name = github_repo.full_name;
        let trello = user_manager.trello(from);
        let boards = await trello.boards();
        let repo_board = trello.getBoardByName(boards, board_name);
        
        if(!repo_board) {
            repo_board = await trello.createBoard({
                name: board_name,
                desc: `Scrum repository for ${github_repo.owner.login}'s ${github_repo.name}`
            });

            await bot.write(from.id, `We didn't found a Board in your Trello for this repo, so... We have created one for you as [${repo}](${repo_board.url})`);
        }

        let lists = await trello.lists(repo_board.id);
        let repo_lists = {};
        let other_lists = [];

        for(let i=0, l=lists.length;i<l;i++) {
            if(lists[i].name === "Backlog")
                repo_lists.backlog = lists[i];
            else if(lists[i].name === "To Do")
                repo_lists.todo = lists[i];
            else if(lists[i].name === "Done")
                repo_lists.done = lists[i];
            else other_lists.push(lists[i]);
        }      
        
        if(!repo_lists.todo){
            repo_lists.todo = await trello.createList({ name: 'To Do', idBoard: repo_board.id, pos: 1 });
            repo_lists.todo.cards = [];
        }

        if(!repo_lists.done) {
            repo_lists.done = await trello.createList({ name: 'Done', idBoard: repo_board.id, pos: 2 });
            repo_lists.done.cards = [];
        }

        if(!repo_lists.backlog) {
            repo_lists.backlog = await trello.createList({ name: 'Backlog', idBoard: repo_board.id, pos: 0 });
            repo_lists.backlog.cards = [];
        }

        if(other_lists.length) {
            await bot.write(from.id, 'We found some lists that should not be in the board:');
            await bot.sendList(from.id, other_lists.map(({ name }) => name));
            await bot.write(from.id, `We recommend you to delete these lists in trello.com.`);
        }

        let issues = await github.issues(repo);
        let { backlog, todo, done } = repo_lists;

        for(let i=0, issue;issue=issues[i++];){
            let { title, body } = issue;
            let { assignees } = issue;
            let users = [];

            for(let j=0;j<assignees.length;j++){
                try {
                    users.push((await trello.get('members/' + assignees[j].login.toLowerCase())).id);
                } catch (e) {
                    try { 
                        if(asignees[j].email)
                            users.push((await trello.get('members/' + assignees[j].email.toLowerCase())).id);
                    } catch (_e) {
                        console.log(e);
                    }
                }
            }
            let card_id = null;

            if(!backlog.cards.some((card) => (card.name === title) && (card_id = card.id))
                && !todo.cards.some((card) => (card.name === title) && (card_id = card.id))
                && !done.cards.some((card) => (card.name === title) && (card_id = card.id))) {
                        await trello.createCard({
                            name: title,
                            desc: body,
                            idList: backlog.id,
                            idMembers: users.join(',')
                        });
            } else await trello.editCard(card_id, {
                desc: body,
                idMembers: users.join(',')
            })
        }

        for(let i=0, card;card=backlog.cards[i++];) {
            if(!issues.some(({ title }) => title === card.name))
                await trello.deleteCard(card.id);
        }

        for(let i=0, card;card=todo.cards[i++];) {
            if(!issues.some(({ title }) => title === card.name))
                await trello.editCard(card.id, { idList: done.id })
        }
        
        await bot.write(from.id, `[${repo}](${repo_board.url}) is *now* completely synchronized with the repository.`);
    };

    bot.command('setup', setup);
    bot.command('issues', issues);
    bot.command('myboards', myboards);
    bot.command('link', link);

    return { bot, github, user_manager, exports };
});