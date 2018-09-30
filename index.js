let App = require('./app');
let colors = require('colors/safe');

App()
    .then(({ bot }) => {
        console.log(colors.cyan(bot.info.first_name) + ` bot is listening for commands...`);

        bot.on('command', ([ name, ...args], { chat }) => {
            console.log(
                colors.cyan("COMMAND:"),
                colors.yellow(chat.first_name),
                "=>",
                colors.green('/' + name),
                args.join(" ")
            );
        });
    })
    .catch((err) => console.log(err));

