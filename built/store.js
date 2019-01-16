(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./item"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const item_1 = require("./item");
    class Store {
        /**
         * @param {!string} name Database name
         * @param {function()} [callback] Called when the Store is ready
         */
        constructor(name, callback) {
            this.name = name;
            this.localStorage = window.localStorage;
            this.liveTodos = [];
            if (callback) {
                callback();
            }
        }
        /**
         * Read the local ItemList from localStorage.
         */
        getLocalStorage() {
            return this.liveTodos || JSON.parse(this.localStorage.getItem(this.name) || '[]');
        }
        ;
        /**
         * Write the local ItemList to localStorage.
         */
        setLocalStorage(todos) {
            this.liveTodos = todos;
            this.localStorage.setItem(this.name, JSON.stringify(todos));
        }
        /**
         * Find items with properties matching those on query.
         *
         * @example
         * db.find({completed: true}, data => {
         *	 // data shall contain items whose completed properties are true
         * })
         */
        find(query, callback) {
            const todos = this.getLocalStorage();
            let k;
            callback(todos.filter((todo) => {
                for (k in query) {
                    if (query[k] !== todo[k]) {
                        return false;
                    }
                }
                return true;
            }));
        }
        /**
         * Update an item in the Store.
         */
        update(update, callback) {
            const id = update.id;
            const todos = this.getLocalStorage();
            let i = todos.length;
            let k;
            while (i--) {
                if (todos[i].id === id) {
                    for (k in update) {
                        todos[i][k] = update[k];
                    }
                    break;
                }
            }
            this.setLocalStorage(todos);
            if (callback) {
                callback();
            }
        }
        /**
         * Insert an item into the Store.
         *
         * @param {Item} item Item to insert
         * @param {function()} [callback] Called when item is inserted
         */
        insert(item, callback) {
            const todos = this.getLocalStorage();
            todos.push(item);
            this.setLocalStorage(todos);
            if (callback) {
                callback();
            }
        }
        /**
         * Remove items from the Store based on a query.
         *
         * @param {ItemQuery} query Query matching the items to remove
         * @param {function(ItemList)|function()} [callback] Called when records matching query are removed
         */
        remove(query, callback) {
            let k;
            const todos = this.getLocalStorage().filter((todo) => {
                for (k in query) {
                    if (query[k] !== todo[k]) {
                        return true;
                    }
                }
                return false;
            });
            this.setLocalStorage(todos);
            if (callback) {
                callback(todos);
            }
        }
        /**
         * Count total, active, and completed todos.
         */
        count(callback) {
            this.find(item_1.emptyItemQuery, data => {
                const total = data.length;
                let i = total;
                let completed = 0;
                while (i--) {
                    if (data[i].completed) {
                        completed++;
                    }
                }
                callback(total, total - completed, completed);
            });
        }
    }
    exports.default = Store;
});
//# sourceMappingURL=store.js.map