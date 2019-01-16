(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * querySelector wrapper
     */
    function qs(selector, scope) {
        return (scope || document).querySelector(selector);
    }
    exports.qs = qs;
    /**
     * addEventListener wrapper
     */
    function $on(target, type, callback, capture) {
        target.addEventListener(type, callback, !!capture);
    }
    exports.$on = $on;
    /**
     * Attach a handler to an event for all elements matching a selector.
     */
    function $delegate(target, selector, type, handler, capture) {
        const dispatchEvent = (event) => {
            const targetElement = event.target;
            const potentialElements = target.querySelectorAll(selector);
            let i = potentialElements.length;
            while (i--) {
                if (potentialElements[i] === targetElement) {
                    handler.call(targetElement, event);
                    break;
                }
            }
        };
        $on(target, type, dispatchEvent, !!capture);
    }
    exports.$delegate = $delegate;
    /**
     * Encode less-than and ampersand characters with entity codes to make user-
     * provided text safe to parse as HTML.
     *
     * @returns {string} String with unsafe characters escaped with entity codes
     */
    exports.escapeForHTML = (s) => s.replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');
});
//# sourceMappingURL=helpers.js.map