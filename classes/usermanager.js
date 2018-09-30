const TrelloAPI = require('../api/trello');

class UserManager {

    constructor (base) {
        this.users = base.users || {};
        this.trellos = {};
    }

    setup  ({ id }, api_key, token) {
        if(!this.users[id])
            return this.users[id] = { id , api_key, token, repos: [] };
        
            
        this.users[id].api_key = api_key;
        this.users[id].token = token;
        
        return this.users[id];
    }

    logout ({ id }) {
        delete this.users[id];
        delete this.trellos[id];
    }

    addRepo (user, url) {
        return this.user(user).repos.push(url);
    }
    
    user ({ id }) { return this.users[id] };

    exists ({ id }) { return this.users[id] !== undefined; }

    trello({ id }) {
        let user = this.user({ id });

        if(!user) return null;
        if(this.trellos[id])
            return this.trellos[id];

        return this.trellos[id] = new TrelloAPI({
            api_key: user.api_key,
            token: user.token
        });        
    }
}

module.exports = UserManager;