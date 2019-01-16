/**
 * querySelector wrapper
 */
export function qs(selector: string, scope?: Element): Element | null {
	return (scope || document).querySelector(selector);
}

/**
 * addEventListener wrapper
 */
export function $on(target: Element | Window, type: string, callback: ((args: Event & { target: HTMLInputElement }) => void), capture?: boolean) {
	target.addEventListener(type, callback as any, !!capture);
}

/**
 * Attach a handler to an event for all elements matching a selector.
 */
export function $delegate(
	target: Element,
	selector: string,
	type: string,
	handler: ((args: Event & { target: HTMLInputElement; keyCode: number; }) => void),
	capture?: boolean,
	) {
	const dispatchEvent = (event: any) => {
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

/**
 * Encode less-than and ampersand characters with entity codes to make user-
 * provided text safe to parse as HTML.
 *
 * @returns {string} String with unsafe characters escaped with entity codes
 */
export const escapeForHTML = (s: string) => s.replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');
