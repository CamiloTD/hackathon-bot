const request = require('request-promise');
const BASE_URL = 'https://api.telegram.org/bot';
const EventEmitter = require('events');

class TelegramBot extends EventEmitter {
    
    constructor (config = {}) {
        super();
        this.token = config.token;
        this.info  = {};
        this.watcher = {
            watching: false,
            pool_size: config.watcher.pool_size || 10,
            delay: config.watcher.delay
        };

        this.command_listener = new EventEmitter();
        
        if(config.watcher.start_watching) this.watch();
    }

    /* Register a command event */
    async command (name, cb) {
        this.command_listener.on(name, cb);
    }

    /* Starts watching for updates */
    async watch () {
        if(this.watcher.watching) return;
        
        this.watcher.watching = true;
        
        while(this.watcher.watching) {
            let update = await this.nextUpdate({
                limit: this.watcher.pool_size,
                offset: this.watcher.offset
            });
            
            for(let i=0, l=update.length;i<l;i++) {
                this.watcher.offset = update[i].update_id + 1;
                let msg = update[i].message;
                
                if(!msg) continue;
                
                let text = msg.text;
                
                
                if(text[0] === "/") {
                    let match = text.substr(1).split(" ");
                    
                    this.emit('command', match, msg);
                    this.command_listener.emit(match[0], match.slice(1), msg);
                }

                if(update && update.length)
                    this.emit('update', msg);
            }

            await (new Promise ((done) => setTimeout(done, this.watcher.delay)));
        }
    }

    /* Stops watching loop */
    async unwatch () { this.watcher.watching = false; }

    /* Initializes the info field with the bot data */
    async load () { return this.info = await this.post('getMe'); }
    
    /* Long Polling request for getting updates { offset, limit, timeout, allowed_updates } */
    async nextUpdate (options) { return await this.post('getUpdates', options); } 

    nextMessage (chat_id) {
        return new Promise ((done, error) => {
            
            const onMessage = (msg) => {
                if(msg.from && chat_id === msg.from.id){
                    this.removeListener('update', onMessage);
                    done(msg);
                }
            }

            process.nextTick(() => this.on('update', onMessage));
        });
    }

    /* Simplifies the POST request to the API */
    async post (method, data = {}) { 
        let response = await request({
            method: 'POST',
            uri: `${BASE_URL}${this.token}/${method}`,
            body: data,
            json: true
        });
        
        if(!response.ok) throw response.description;

        return response.result;
    }

    /* Generic sendMessage method, see: https://core.telegram.org/bots/api#sendmessage */
    async sendMessage (options) {
        return this.post('sendMessage', options);
    }

    /* Send simple text to a chat */
    async write (chat_id, text) {
        return this.sendMessage({ chat_id, text, parse_mode: "Markdown" })
    }

    sendList (id, elements) {
        return this.write(id, elements.map((e, i) => (i + 1) + ". " + e).join("\n"));
    }
}

module.exports = TelegramBot;