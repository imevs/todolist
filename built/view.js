(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./helpers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const helpers_1 = require("./helpers");
    const _itemId = (element) => parseInt(element.parentNode.dataset.id || element.parentNode.parentNode.dataset.id, 10);
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    class View {
        /**
         * @param {!Template} template A Template instance
         */
        constructor(template) {
            this.template = template;
            this.$todoList = helpers_1.qs('.todo-list');
            this.$todoItemCounter = helpers_1.qs('.todo-count');
            this.$clearCompleted = helpers_1.qs('.clear-completed');
            this.$main = helpers_1.qs('.main');
            this.$toggleAll = helpers_1.qs('.toggle-all');
            this.$newTodo = helpers_1.qs('.new-todo');
            helpers_1.$delegate(this.$todoList, 'li label', 'dblclick', ({ target }) => {
                this.editItem(target);
            });
        }
        /**
         * Put an item into edit mode.
         */
        editItem(target) {
            const listItem = target.parentElement.parentElement;
            listItem.classList.add('editing');
            const input = document.createElement('input');
            input.className = 'edit';
            input.value = target.innerText;
            listItem.appendChild(input);
            input.focus();
        }
        /**
         * Populate the todo list with a list of items.
         */
        showItems(items) {
            this.$todoList.innerHTML = this.template.itemList(items);
        }
        /**
         * Remove an item from the view.
         *
         * @param {number} id Item ID of the item to remove
         */
        removeItem(id) {
            const elem = helpers_1.qs(`[data-id="${id}"]`);
            if (elem) {
                this.$todoList.removeChild(elem);
            }
        }
        /**
         * Set the number in the 'items left' display.
         *
         * @param {number} itemsLeft Number of items left
         */
        setItemsLeft(itemsLeft) {
            this.$todoItemCounter.innerHTML = this.template.itemCounter(itemsLeft);
        }
        /**
         * Set the visibility of the "Clear completed" button.
         *
         * @param {boolean|number} visible Desired visibility of the button
         */
        setClearCompletedButtonVisibility(visible) {
            this.$clearCompleted.style.display = !!visible ? 'block' : 'none';
        }
        /**
         * Set the visibility of the main content and footer.
         *
         * @param {boolean|number} visible Desired visibility
         */
        setMainVisibility(visible) {
            this.$main.style.display = !!visible ? 'block' : 'none';
        }
        /**
         * Set the checked state of the Complete All checkbox.
         *
         * @param {boolean|number} checked The desired checked state
         */
        setCompleteAllCheckbox(checked) {
            this.$toggleAll.checked = !!checked;
        }
        /**
         * Change the appearance of the filter buttons based on the route.
         *
         * @param {string} route The current route
         */
        updateFilterButtons(route) {
            helpers_1.qs('.filters .selected').className = '';
            helpers_1.qs(`.filters [href="#/${route}"]`).className = 'selected';
        }
        /**
         * Clear the new todo input
         */
        clearNewTodo() {
            this.$newTodo.value = '';
        }
        /**
         * Render an item as either completed or not.
         */
        setItemComplete(id, completed) {
            const listItem = helpers_1.qs(`[data-id="${id}"]`);
            if (!listItem) {
                return;
            }
            listItem.className = completed ? 'completed' : '';
            // In case it was toggled from an event and not by clicking the checkbox
            helpers_1.qs('input', listItem).checked = completed;
        }
        /**
         * Bring an item out of edit mode.
         *
         * @param {!number} id Item ID of the item in edit
         * @param {!string} title New title for the item in edit
         */
        editItemDone(id, title) {
            const listItem = helpers_1.qs(`[data-id="${id}"]`);
            const input = helpers_1.qs('input.edit', listItem);
            listItem.removeChild(input);
            listItem.classList.remove('editing');
            helpers_1.qs('label', listItem).textContent = title;
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindAddItem(handler) {
            helpers_1.$on(this.$newTodo, 'change', ({ target }) => {
                const title = target.value.trim();
                if (title) {
                    handler(title);
                }
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindRemoveCompleted(handler) {
            helpers_1.$on(this.$clearCompleted, 'click', handler);
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindToggleAll(handler) {
            helpers_1.$on(this.$toggleAll, 'click', ({ target }) => {
                handler(target.checked);
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindRemoveItem(handler) {
            helpers_1.$delegate(this.$todoList, '.destroy', 'click', ({ target }) => {
                handler(_itemId(target));
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindToggleItem(handler) {
            helpers_1.$delegate(this.$todoList, '.toggle', 'click', ({ target }) => {
                handler(_itemId(target), target.checked);
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindEditItemSave(handler) {
            helpers_1.$delegate(this.$todoList, 'li .edit', 'blur', ({ target }) => {
                if (!target.dataset.iscanceled) {
                    handler(_itemId(target), target.value.trim());
                }
            }, true);
            // Remove the cursor from the input when you hit enter just like if it were a real form
            helpers_1.$delegate(this.$todoList, 'li .edit', 'keypress', ({ target, keyCode }) => {
                if (keyCode === ENTER_KEY) {
                    target.blur();
                }
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindEditItemCancel(handler) {
            helpers_1.$delegate(this.$todoList, 'li .edit', 'keyup', ({ target, keyCode }) => {
                if (keyCode === ESCAPE_KEY) {
                    target.dataset.iscanceled = true;
                    target.blur();
                    handler(_itemId(target));
                }
            });
        }
    }
    exports.default = View;
});
//# sourceMappingURL=view.js.map