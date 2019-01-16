import {emptyItemQuery, ItemType} from './item';

export default class Store {
	public localStorage = window.localStorage;
	public liveTodos: ItemType[] = [];

	/**
	 * @param {!string} name Database name
	 * @param {function()} [callback] Called when the Store is ready
	 */
	constructor(public name: string, callback?: () => void) {
		if (callback) {
			callback();
		}
	}

	/**
	 * Read the local ItemList from localStorage.
	 */
	getLocalStorage (): ItemType[] {
		return this.liveTodos || JSON.parse(this.localStorage.getItem(this.name) || '[]');
	};

	/**
	 * Write the local ItemList to localStorage.
	 */
	setLocalStorage(todos: ItemType[]) {
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
	find(query: { [k: string]: any; }, callback: (items: ItemType[]) => void) {
		const todos = this.getLocalStorage();
		let k;

		callback(todos.filter((todo: { [k: string]: any; }) => {
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
	update(update: { [k: string]: any; }, callback: Function) {
		const id = update.id;
		const todos = this.getLocalStorage() as ({ [k: string]: any; })[];
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

		this.setLocalStorage(todos as ItemType[]);

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
	insert(item: ItemType, callback: Function) {
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
	remove(query: { [k: string]: any; }, callback: (arg: boolean) => void) {
		let k;

		const todos = this.getLocalStorage().filter((todo: { [k: string]: any; }) => {
			for (k in query) {
				if (query[k] !== todo[k]) {
					return true;
				}
			}
			return false;
		});

		this.setLocalStorage(todos);

		if (callback) {
			callback(todos as any);
		}
	}

	/**
	 * Count total, active, and completed todos.
	 */
	count(callback: (total: number, active: number, completed: number) => void) {
		this.find(emptyItemQuery, data => {
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
