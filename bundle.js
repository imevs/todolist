define("item", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Empty = {
        Record: {}
    };
    exports.emptyItemQuery = Empty.Record;
});
define("store", ["require", "exports", "item"], function (require, exports, item_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
            return this.liveTodos; // || JSON.parse(this.localStorage.getItem(this.name) || '[]');
        }
        ;
        /**
         * Write the local ItemList to localStorage.
         */
        setLocalStorage(todos) {
            this.liveTodos = todos;
            // this.localStorage.setItem(this.name, JSON.stringify(todos));
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
define("helpers", ["require", "exports"], function (require, exports) {
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
define("template", ["require", "exports", "helpers"], function (require, exports, helpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
define("view", ["require", "exports", "helpers"], function (require, exports, helpers_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _itemId = (element) => parseInt(element.parentNode.dataset.id || element.parentNode.parentNode.dataset.id, 10);
    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;
    class View {
        /**
         * @param {!Template} template A Template instance
         */
        constructor(template) {
            this.template = template;
            this.$todoList = helpers_2.qs('.todo-list');
            this.$todoItemCounter = helpers_2.qs('.todo-count');
            this.$clearCompleted = helpers_2.qs('.clear-completed');
            this.$main = helpers_2.qs('.main');
            this.$toggleAll = helpers_2.qs('.toggle-all');
            this.$newTodo = helpers_2.qs('.new-todo');
            helpers_2.$delegate(this.$todoList, 'li label', 'dblclick', ({ target }) => {
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
            const elem = helpers_2.qs(`[data-id="${id}"]`);
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
            helpers_2.qs('.filters .selected').className = '';
            helpers_2.qs(`.filters [href="#/${route}"]`).className = 'selected';
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
            const listItem = helpers_2.qs(`[data-id="${id}"]`);
            if (!listItem) {
                return;
            }
            listItem.className = completed ? 'completed' : '';
            // In case it was toggled from an event and not by clicking the checkbox
            helpers_2.qs('input', listItem).checked = completed;
        }
        /**
         * Bring an item out of edit mode.
         *
         * @param {!number} id Item ID of the item in edit
         * @param {!string} title New title for the item in edit
         */
        editItemDone(id, title) {
            const listItem = helpers_2.qs(`[data-id="${id}"]`);
            const input = helpers_2.qs('input.edit', listItem);
            listItem.removeChild(input);
            listItem.classList.remove('editing');
            helpers_2.qs('label', listItem).textContent = title;
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindAddItem(handler) {
            helpers_2.$on(this.$newTodo, 'change', ({ target }) => {
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
            helpers_2.$on(this.$clearCompleted, 'click', handler);
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindToggleAll(handler) {
            helpers_2.$on(this.$toggleAll, 'click', ({ target }) => {
                handler(target.checked);
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindRemoveItem(handler) {
            helpers_2.$delegate(this.$todoList, '.destroy', 'click', ({ target }) => {
                handler(_itemId(target));
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindToggleItem(handler) {
            helpers_2.$delegate(this.$todoList, '.toggle', 'click', ({ target }) => {
                handler(_itemId(target), target.checked);
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindEditItemSave(handler) {
            helpers_2.$delegate(this.$todoList, 'li .edit', 'blur', ({ target }) => {
                if (!target.dataset.iscanceled) {
                    handler(_itemId(target), target.value.trim());
                }
            }, true);
            // Remove the cursor from the input when you hit enter just like if it were a real form
            helpers_2.$delegate(this.$todoList, 'li .edit', 'keypress', ({ target, keyCode }) => {
                if (keyCode === ENTER_KEY) {
                    target.blur();
                }
            });
        }
        /**
         * @param {Function} handler Function called on synthetic event.
         */
        bindEditItemCancel(handler) {
            helpers_2.$delegate(this.$todoList, 'li .edit', 'keyup', ({ target, keyCode }) => {
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
define("controller", ["require", "exports", "item"], function (require, exports, item_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
                    '': item_2.emptyItemQuery,
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
define("app", ["require", "exports", "controller", "helpers", "template", "store", "view"], function (require, exports, controller_1, helpers_3, template_1, store_1, view_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const store = new store_1.default('todos-vanilla-typescript');
    const template = new template_1.default();
    const view = new view_1.default(template);
    const controller = new controller_1.default(store, view);
    exports.todoApp = controller;
    const setView = () => controller.setView(document.location.hash);
    helpers_3.$on(window, 'load', setView);
    helpers_3.$on(window, 'hashchange', setView);
});
define("signallingServer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SERVICE_PATH = "https://api.jsonbin.io/b/";
    const resourceID = "5c3fb59481fe89272a8d96b5";
    const saveData = (path, data) => {
        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState == XMLHttpRequest.DONE) {
                console.log("Data saved");
            }
        };
        req.open("PUT", path, true);
        req.setRequestHeader("Content-type", "application/json");
        req.send(data);
    };
    const fetchRemoteSdp = (path) => {
        return fetch(path + "/latest").then(data => data.text()).then(data => JSON.parse(data));
    };
    class SignallingServer {
        constructor() {
            this.onMessage = (originOffer, callback) => {
                const path = SERVICE_PATH + resourceID;
                if (!originOffer) {
                    fetchRemoteSdp(path).then(data => {
                        callback(data);
                    });
                }
                else {
                    const checkData = setInterval(() => {
                        fetchRemoteSdp(path).then(data => {
                            if (data.answer !== originOffer.answer) {
                                callback(data);
                                clearInterval(checkData);
                            }
                        });
                    }, 1000);
                }
            };
        }
        send(data) {
            saveData(SERVICE_PATH + resourceID, JSON.stringify(data));
        }
    }
    exports.SignallingServer = SignallingServer;
});
define("p2p", ["require", "exports", "app", "signallingServer"], function (require, exports, app_1, signallingServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const signallingServer = new signallingServer_1.SignallingServer();
    const isHost = window.location.search.indexOf("host") !== -1;
    const connection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // { urls: 'stun:stun1.l.google.com:19302' },
            // { urls: 'stun:stun2.l.google.com:19302' },
            // { urls: 'stun:stun3.l.google.com:19302' },
            // { urls: 'stun:stun4.l.google.com:19302' },
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }
        ]
    });
    const iceCandidatesPromise = new Promise((resolve, reject) => {
        const iceCandidates = [];
        connection.onicecandidate = (event) => {
            if (event.candidate) {
                iceCandidates.push(event.candidate.candidate);
            }
            else {
                resolve(iceCandidates);
            }
        };
    });
    const channelExport = {
        channel: null,
        send: (msg) => channelExport.channel && channelExport.channel.send(msg),
        onMessage: (msg) => {
            console.log("default onMessage", msg);
        },
    };
    const p2pConnectionReady = () => new Promise((resolve, reject) => {
        let channel = connection.createDataChannel('dataChannel');
        channelExport.channel = channel;
        channel.onopen = () => {
            const readyState = channel.readyState;
            console.log('channel state is: ' + readyState);
            resolve(channelExport);
        };
        connection.ondatachannel = (event) => {
            console.log("ondatachannel");
            channel = event.channel;
            channelExport.channel = channel;
        };
        channel.onmessage = (data) => {
            channelExport.onMessage(data);
        };
    });
    const addIceCandidate = (candidate) => {
        connection.addIceCandidate(new RTCIceCandidate({
            candidate: candidate,
            sdpMLineIndex: 0,
            sdpMid: "data",
        }));
    };
    const createOffer = () => {
        return connection.createOffer().then((desc) => {
            connection.setLocalDescription(desc);
            return iceCandidatesPromise.then((iceCandidates) => {
                const originOffer = {
                    offer: desc.sdp,
                    answer: "",
                    ice: iceCandidates,
                };
                signallingServer.send(originOffer);
                return originOffer;
            });
        });
    };
    const connectToRemote = (args, isOffer) => {
        connection.setRemoteDescription(new RTCSessionDescription({
            sdp: isOffer ? args.offer : args.answer,
            type: isOffer ? "offer" : "answer",
        }));
    };
    const reofferOnHost = () => {
        createOffer().then(offer => {
            setConnectingStatus();
            signallingServer.onMessage(offer, data => {
                connectToRemote(data, false);
            });
        });
    };
    const reofferOnClient = () => {
        p2pConnectionReady().then((channel) => {
            channel.onMessage = (msg) => {
                console.log("Received", msg);
                const data = JSON.parse(msg.data);
                app_1.todoApp.store.setLocalStorage(data);
                app_1.todoApp._filter(true);
            };
        });
        setConnectingStatus();
        signallingServer.onMessage(null, data => {
            connectToRemote(data, true);
            data.ice.forEach(addIceCandidate);
            connection.createAnswer().then((desc) => {
                connection.setLocalDescription(desc);
                signallingServer.send({
                    offer: data.offer,
                    answer: desc.sdp,
                    ice: data.ice,
                });
            });
        });
    };
    const reoffer = isHost ? reofferOnHost : reofferOnClient;
    if (isHost) {
        p2pConnectionReady().then((channel) => {
            console.log("Send data");
            setInterval(() => {
                channel.send(JSON.stringify(app_1.todoApp.store.getLocalStorage()));
            }, 5000);
        });
    }
    reoffer();
    let isReconnecting = false;
    window.addEventListener('unhandledrejection', (error) => {
        if (isReconnecting)
            return;
        console.log("Fail to connect");
        setDisconnectedStatus();
        isReconnecting = true;
        setTimeout(() => {
            reoffer();
            isReconnecting = false;
        }, 1000);
    });
    connection.oniceconnectionstatechange = () => {
        console.log("iceConnectionState", connection.iceConnectionState);
        switch (connection.iceConnectionState) {
            case "connected":
            case "completed":
                setConnectedStatus();
                break;
            case "closed":
            case "failed":
            case "disconnected":
                setDisconnectedStatus();
                reoffer();
                break;
        }
    };
    function setConnectedStatus() {
        console.log("setConnectedStatus");
        const bar = document.querySelector("[name=theme-color]");
        bar.content = "green";
        const favicon = document.getElementById('favicon');
        favicon.href = "circle-green.png";
    }
    function setDisconnectedStatus() {
        console.log("setDisconnectedStatus");
        const bar = document.querySelector("[name=theme-color]");
        bar.content = "red";
        const favicon = document.getElementById('favicon');
        favicon.href = "circle-red.png";
    }
    function setConnectingStatus() {
        console.log("setConnectingStatus");
        const bar = document.querySelector("[name=theme-color]");
        bar.content = "orange";
        const favicon = document.getElementById('favicon');
        favicon.href = "circle-orange.png";
    }
});
//# sourceMappingURL=bundle.js.map