const Config = require('../config');
const App = require('../app');
const colors = require('colors/safe');
const test_config = {
    api_key: "20ce2aefc5f1f780df97970df8c64cc2",
    token: "84a55b0c060ea94fce969b93d014b720e4c47e2827f7c03c36647e52417effa3",
    user_id: 665822399,
    github_repo: 'CamiloTD/hackathon-bot'
}

let test_count = 1;
const test = ( msg ) => {
    let i = test_count++;
    process.stdout.write(colors.cyan(`\r${i} - ${msg} (?)`));

    return {
        ok  : () => process.stdout.write(colors.green(`\r${i} - ${msg} (OK)\n`)),
        fail: () => process.stdout.write(colors.red  (`\r${i} - ${msg} (FAIL)\n`))
    }
};

let TEST;

const configure = async () => {
    TEST = test("Configuring app");
    let { bot, github, user_manager, exports } = await App();
    TEST.ok();

    return { bot, github, user_manager, exports };
};

const _setup = ({ bot, user_manager }) => new Promise((done, error) =>{
    TEST = test("/setup: Setting up a trello account");
    user_manager.logout(test_config.user_id);

    bot.command_listener.once('setup', () => {
        let user = user_manager.user({ id: test_config.user_id });

        if(!user)
            return error("User is not being saved.");
        
        if(user.api_key !== test_config.api_key || user.token !== test_config.token)
            return error("API Keys not being correctly saved");
        
        TEST.ok();
        done();
    });
    
    bot.command_listener.emit('setup',
        [ test_config.api_key, test_config.token ],
        { from: { id: test_config.user_id }}
    );
});

const _link = ({ bot, user_manager, github, exports }) => new Promise(async (done, error) =>{
    TEST = test("/link: Linking a public github repo to a board");
    
    let trello = user_manager.trello({ id: test_config.user_id });
    let { github_repo } = test_config;
    let boards = await trello.boards();

    if(!boards)
        return error("Invalid trello credentials.");

    for(let i=0, board;board=boards[i++];)
        if(board.name === github_repo)
            await trello.del(`boards/${board.id}`);
    
    boards = await trello.boards();
    
    if(boards.some((board) => board.name === github_repo))
        return error("Boards are not being deleted correctly.");

    exports.link([ github_repo ], { from: { id: test_config.user_id }}).then(async () => {
        boards = await trello.boards();
        let issues = await github.issues(github_repo);

        let board = trello.getBoardByName(boards, github_repo);

        if(!board)
            return error("Board is not being created correctly.");
        
        let lists = await trello.lists(board.id);
        let backlog = null;

        for(let i=0, list;list=lists[i++];) {
            if(list.name === "Backlog") {
                backlog = list;
                break;
            }
        }

        if(!backlog)
            return error("Backlog is not being created.");
        
        backlog.cards = (backlog.cards || []);

        for(let i, card;card=backlog.cards[i++];)
            if(!issues.some(({ title }) => title === card.name))
                return error(card.name + " is not synchronized.");
        
        TEST.ok();
        done();
    }).catch((err) => console.log(err));
});

(async () => {
    console.log(colors.cyan("-- Testing Functionalities -- \n"));

    try {
        let app = await configure();
        let setup = await _setup(app);
        let link = await _link(app);

        console.log(colors.cyan("\nTests completed! good bye!"));
        process.exit();
    } catch (exc) {
        TEST.fail();
        console.log(exc);
        process.exit();
    }
})();