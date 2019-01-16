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
    class Controller {
        constructor(store, view) {
            this.store = store;
            this.view = view;
            this._activeRoute = '';
            this._lastActiveRoute = null;
            view.bindAddItem(this.addItem.bind(this));
            view.bindEditItemSave(this.editItemSave.bind(this));
            view.bindEditItemCancel(this.editItemCancel.bind(this));
            view.bindRemoveItem(this.removeItem.bind(this));
            view.bindToggleItem((id, completed) => {
                this.toggleCompleted(id, completed);
                this._filter();
            });
            view.bindRemoveCompleted(this.removeCompletedItems.bind(this));
            view.bindToggleAll(this.toggleAll.bind(this));
        }
        /**
         * Set and render the active route.
         *
         * @param {string} raw '' | '#/' | '#/active' | '#/completed'
         */
        setView(raw) {
            const route = raw.replace(/^#\//, '');
            this._activeRoute = route;
            this._filter();
            this.view.updateFilterButtons(route);
        }
        /**
         * Add an Item to the Store and display it in the list.
         *
         * @param {!string} title Title of the new item
         */
        addItem(title) {
            this.store.insert({
                id: Date.now(),
                title,
                completed: false
            }, () => {
                this.view.clearNewTodo();
                this._filter(true);
            });
        }
        /**
         * Save an Item in edit.
         */
        editItemSave(id, title) {
            if (title.length) {
                this.store.update({ id, title }, () => {
                    this.view.editItemDone(id, title);
                });
            }
            else {
                this.removeItem(id);
            }
        }
        /**
         * Cancel the item editing mode.
         */
        editItemCancel(id) {
            this.store.find({ id }, (data) => {
                const title = data[0].title;
                this.view.editItemDone(id, title);
            });
        }
        /**
         * Remove the data and elements related to an Item.
         */
        removeItem(id) {
            this.store.remove({ id }, () => {
                this._filter();
                this.view.removeItem(id);
            });
        }
        /**
         * Remove all completed items.
         */
        removeCompletedItems() {
            this.store.remove({ completed: true }, this._filter.bind(this));
        }
        /**
         * Update an Item in storage based on the state of completed.
         */
        toggleCompleted(id, completed) {
            this.store.update({ id, completed }, () => {
                this.view.setItemComplete(id, completed);
            });
        }
        /**
         * Set all items to complete or active.
         */
        toggleAll(completed) {
            this.store.find({ completed: !completed }, (data) => {
                for (let { id } of data) {
                    this.toggleCompleted(id, completed);
                }
            });
            this._filter();
        }
        /**
         * Refresh the list based on the current route.
         */
        _filter(force) {
            const route = this._activeRoute;
            if (force || this._lastActiveRoute !== '' || this._lastActiveRoute !== route) {
                /* jscs:disable disallowQuotedKeysInObjects */
                this.store.find({
                    '': item_1.emptyItemQuery,
                    'active': { completed: false },
                    'completed': { completed: true }
                }[route], this.view.showItems.bind(this.view));
                /* jscs:enable disallowQuotedKeysInObjects */
            }
            this.store.count((total, active, completed) => {
                this.view.setItemsLeft(active);
                this.view.setClearCompletedButtonVisibility(completed);
                this.view.setCompleteAllCheckbox(completed === total);
                this.view.setMainVisibility(total);
            });
            this._lastActiveRoute = route;
        }
    }
    exports.default = Controller;
});
//# sourceMappingURL=controller.js.map