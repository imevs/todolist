(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./controller", "./helpers", "./template", "./store", "./view"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const controller_1 = require("./controller");
    const helpers_1 = require("./helpers");
    const template_1 = require("./template");
    const store_1 = require("./store");
    const view_1 = require("./view");
    const store = new store_1.default('todos-vanilla-typescript');
    const template = new template_1.default();
    const view = new view_1.default(template);
    const controller = new controller_1.default(store, view);
    const setView = () => controller.setView(document.location.hash);
    helpers_1.$on(window, 'load', setView);
    helpers_1.$on(window, 'hashchange', setView);
});
//# sourceMappingURL=app.js.map