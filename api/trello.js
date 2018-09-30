const request = require('request-promise');
const BASE_URL = 'https://api.trello.com/1';

class TrelloAPI {

    constructor (config) {
        this.api_key = config.api_key;
        this.token = config.token;
        this.current_board = null;
    }

    async post (method, data = {}) {
        return JSON.parse(await request({
            method: 'POST',
            url: `${BASE_URL}/${method}`,
            qs: { key: this.api_key, token: this.token, ...data }
        }));
    }

    async get (method, data = {}) {
        return JSON.parse(await request({
            method: 'GET',
            url: `${BASE_URL}/${method}`,
            qs: { key: this.api_key, token: this.token, ...data }
        }));
    }

    async del (method, data = {}) {
        return JSON.parse(await request({
            method: 'DELETE',
            url: `${BASE_URL}/${method}`,
            qs: { key: this.api_key, token: this.token, ...data }
        }));
    }

    async put (method, data = {}) {
        return JSON.parse(await request({
            method: 'PUT',
            url: `${BASE_URL}/${method}`,
            qs: { key: this.api_key, token: this.token, ...data }
        }));
    }

    getBoardByName (boards, name) {
        for(let i=0, l=boards.length;i<l;i++) {
            let _board = boards[i];

            if(_board.name === name) return _board;
        }

    } 

    createBoard (board) {
        return this.post('boards', board);
    }

    createList (list) {
        return this.post('lists', list);
    }

    createCard (card) {
        return this.post('card', card);
    }

    deleteCard (id) {
        return this.del(`card/${id}`);
    }

    editCard (id, data) {
        return this.put(`cards/${id}`, data);
    }

    boards () {
        return this.get('Members/me/boards');
    }

    lists (id) {
        return this.get(`boards/${id}/lists`, { cards: 'all' });
    }

    async test () {
        try {
            await this.boards();
            return true;
        } catch (exc) {
            return false;
        }
    }

    sync (github, repo) {

    }
}

module.exports = TrelloAPI;