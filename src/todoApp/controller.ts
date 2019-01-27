import {emptyItemQuery, ItemType} from './item';
import Store from './store';
import View from './view';

export default class Controller {
	private _activeRoute: '' | 'active' | 'completed' = '';
	private _lastActiveRoute: '' | 'active' | 'completed' | null = null;

	constructor(public store: Store, public view: View) {
		view.bindAddItem(this.addItem.bind(this));
		view.bindEditItemSave(this.editItemSave.bind(this));
		view.bindEditItemCancel(this.editItemCancel.bind(this));
		view.bindRemoveItem(this.removeItem.bind(this));
		view.bindToggleItem((id: number, completed: boolean) => {
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
	setView(raw: string) {
		const route = raw.replace(/^#\//, '') as '' | 'active' | 'completed';
		this._activeRoute = route;
		this._filter();
		this.view.updateFilterButtons(route);
	}

	/**
	 * Add an Item to the Store and display it in the list.
	 *
	 * @param {!string} title Title of the new item
	 */
	addItem(title: string) {
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
	editItemSave(id: number, title: string) {
		if (title.length) {
			this.store.update({id, title}, () => {
				this.view.editItemDone(id, title);
			});
		} else {
			this.removeItem(id);
		}
	}

	/**
	 * Cancel the item editing mode.
	 */
	editItemCancel(id: number) {
		this.store.find({id}, (data: ItemType[]) => {
			const title = data[0].title;
			this.view.editItemDone(id, title);
		});
	}

	/**
	 * Remove the data and elements related to an Item.
	 */
	removeItem(id: number) {
		this.store.remove({id}, () => {
			this._filter();
			this.view.removeItem(id);
		});
	}

	/**
	 * Remove all completed items.
	 */
	removeCompletedItems() {
		this.store.remove({completed: true}, this._filter.bind(this));
	}

	/**
	 * Update an Item in storage based on the state of completed.
	 */
	toggleCompleted(id: number, completed: boolean) {
		this.store.update({id, completed}, () => {
			this.view.setItemComplete(id, completed);
		});
	}

	/**
	 * Set all items to complete or active.
	 */
	toggleAll(completed: boolean) {
		this.store.find({completed: !completed}, (data: ItemType[]) => {
			for (let {id} of data) {
				this.toggleCompleted(id, completed);
			}
		});

		this._filter();
	}

	/**
	 * Refresh the list based on the current route.
	 */
	_filter(force?: boolean) {
		const route = this._activeRoute;

		if (force || this._lastActiveRoute !== '' || this._lastActiveRoute !== route) {
			/* jscs:disable disallowQuotedKeysInObjects */
			this.store.find({
				'': emptyItemQuery,
				'active': {completed: false},
				'completed': {completed: true}
			}[route], this.view.showItems.bind(this.view));
			/* jscs:enable disallowQuotedKeysInObjects */
		}

		this.store.count((total: number, active: number, completed: number) => {
			this.view.setItemsLeft(active);
			this.view.setClearCompletedButtonVisibility(completed);

			this.view.setCompleteAllCheckbox(completed === total);
			this.view.setMainVisibility(total);
		});

		this._lastActiveRoute = route;
	}
}
