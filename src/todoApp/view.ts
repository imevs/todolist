import {ItemType} from './item';
import {qs, $on, $delegate} from './helpers';
import Template from './template';

const _itemId = (element: any) => parseInt(element.parentNode!.dataset.id || element.parentNode.parentNode.dataset.id, 10);
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

export default class View {

	public $todoList: Element = qs('.todo-list')!;
	public $todoItemCounter = qs('.todo-count')!;
	public $clearCompleted = qs('.clear-completed')! as (Element & ElementCSSInlineStyle);
	public $main = qs('.main')! as (Element & ElementCSSInlineStyle);
	public $toggleAll = qs('.toggle-all')! as HTMLInputElement;
	public $newTodo = qs('.new-todo')! as HTMLInputElement;

	/**
	 * @param {!Template} template A Template instance
	 */
	constructor(public template: Template) {
		$delegate(this.$todoList!, 'li label', 'dblclick', ({target}) => {
			this.editItem(target as HTMLElement);
		});
	}


	/**
	 * Put an item into edit mode.
	 */
	editItem(target: HTMLElement) {
		const listItem = target.parentElement!.parentElement!;

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
	showItems(items: ItemType[]) {
		this.$todoList.innerHTML = this.template.itemList(items);
	}

	/**
	 * Remove an item from the view.
	 *
	 * @param {number} id Item ID of the item to remove
	 */
	removeItem(id: number) {
		const elem = qs(`[data-id="${id}"]`);

		if (elem) {
			this.$todoList.removeChild(elem);
		}
	}

	/**
	 * Set the number in the 'items left' display.
	 *
	 * @param {number} itemsLeft Number of items left
	 */
	setItemsLeft(itemsLeft: number) {
		this.$todoItemCounter.innerHTML = this.template.itemCounter(itemsLeft);
	}

	/**
	 * Set the visibility of the "Clear completed" button.
	 *
	 * @param {boolean|number} visible Desired visibility of the button
	 */
	setClearCompletedButtonVisibility(visible: boolean | number) {
		this.$clearCompleted.style.display = !!visible ? 'block' : 'none';
	}

	/**
	 * Set the visibility of the main content and footer.
	 *
	 * @param {boolean|number} visible Desired visibility
	 */
	setMainVisibility(visible: boolean | number) {
		this.$main.style.display = !!visible ? 'block' : 'none';
	}

	/**
	 * Set the checked state of the Complete All checkbox.
	 *
	 * @param {boolean|number} checked The desired checked state
	 */
	setCompleteAllCheckbox(checked: boolean | number) {
		this.$toggleAll.checked = !!checked;
	}

	/**
	 * Change the appearance of the filter buttons based on the route.
	 *
	 * @param {string} route The current route
	 */
	updateFilterButtons(route: string) {
		qs('.filters .selected')!.className = '';
		qs(`.filters [href="#/${route}"]`)!.className = 'selected';
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
	setItemComplete(id: number, completed: boolean) {
		const listItem = qs(`[data-id="${id}"]`);

		if (!listItem) {
			return;
		}

		listItem.className = completed ? 'completed' : '';

		// In case it was toggled from an event and not by clicking the checkbox
		(qs('input', listItem) as HTMLInputElement).checked = completed;
	}

	/**
	 * Bring an item out of edit mode.
	 *
	 * @param {!number} id Item ID of the item in edit
	 * @param {!string} title New title for the item in edit
	 */
	editItemDone(id: number, title: string) {
		const listItem = qs(`[data-id="${id}"]`)!;

		const input = qs('input.edit', listItem)!;
		listItem.removeChild(input);

		listItem.classList.remove('editing');

		(qs('label', listItem) as Node).textContent = title;
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindAddItem(handler: (title: string) => void) {
		$on(this.$newTodo, 'change', ({target}) => {
			const title = target!.value.trim();
			if (title) {
				handler(title);
			}
		});
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindRemoveCompleted(handler: Function) {
		$on(this.$clearCompleted, 'click', handler as any);
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindToggleAll(handler: Function) {
		$on(this.$toggleAll, 'click', ({target}) => {
			handler(target.checked);
		});
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindRemoveItem(handler: Function) {
		$delegate(this.$todoList, '.destroy', 'click', ({target}) => {
			handler(_itemId(target));
		});
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindToggleItem(handler: Function) {
		$delegate(this.$todoList, '.toggle', 'click', ({target}) => {
			handler(_itemId(target), target.checked);
		});
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindEditItemSave(handler: Function) {
		$delegate(this.$todoList, 'li .edit', 'blur', ({target}) => {
			if (!target.dataset.iscanceled) {
				handler(_itemId(target), target.value.trim());
			}
		}, true);

		// Remove the cursor from the input when you hit enter just like if it were a real form
		$delegate(this.$todoList, 'li .edit', 'keypress', ({target, keyCode}) => {
			if (keyCode === ENTER_KEY) {
				target.blur();
			}
		});
	}

	/**
	 * @param {Function} handler Function called on synthetic event.
	 */
	bindEditItemCancel(handler: Function) {
		$delegate(this.$todoList, 'li .edit', 'keyup', ({target, keyCode}) => {
			if (keyCode === ESCAPE_KEY) {
				(target as any).dataset.iscanceled = true;
				target.blur();

				handler(_itemId(target));
			}
		});
	}
}
