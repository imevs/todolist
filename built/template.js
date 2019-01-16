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
    class Template {
        /**
         * Format the contents of a todo list.
         *
         * @param {ItemList} items Object containing keys you want to find in the template to replace.
         * @returns {!string} Contents for a todo list
         *
         * @example
         * view.show({
         *	id: 1,
         *	title: "Hello World",
         *	completed: false,
         * })
         */
        itemList(items) {
            return items.reduce((a, item) => a + `
<li data-id="${item.id}"${item.completed ? ' class="completed"' : ''}>
	<div class="view">
		<input class="toggle" type="checkbox" ${item.completed ? 'checked' : ''}>
		<label>${helpers_1.escapeForHTML(item.title)}</label>
		<button class="destroy"></button>
	</div>
</li>`, '');
        }
        /**
         * Format the contents of an "items left" indicator.
         *
         * @param {number} activeTodos Number of active todos
         *
         * @returns {!string} Contents for an "items left" indicator
         */
        itemCounter(activeTodos) {
            return `${activeTodos} item${activeTodos !== 1 ? 's' : ''} left`;
        }
    }
    exports.default = Template;
});
//# sourceMappingURL=template.js.map