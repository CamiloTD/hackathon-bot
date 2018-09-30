const request  = require('request-promise');
const BASE_URL = 'https://api.github.com';

class GithubAPI {

    constructor (config) {}

    async get (method) {
        return JSON.parse(await request({
            uri: `${BASE_URL}/${method}`,
            headers: {
                'User-Agent': 'Tellonizer-Bot'
            }
        }));
    }

    async user (name) {
        return await get(`users/${name}`);
    }

    async issues (repo) {
        let issues = await this.get(`repos/${repo}/issues`);
        let _issues = [];

        for(let i=0, l=issues.length;i<l;i++)
            if(issues[i].state === "open")
                _issues.push(issues[i]);
        
        return _issues;
    }

    repo (repo) {
        return this.get(`repos/${repo}`);
    }

    async exists () {
        try {
            await this.repo(repo);
            return true;
        } catch (exc) {
            return false;
        }
    }
}

module.exports = GithubAPI;