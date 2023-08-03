/**
 * 防抖
 */
export function debounce(fn: Function, wait: number) {
	let timeout: NodeJS.Timeout;
	return function (...args: any[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn.apply(this, args);
		}, wait);
	};
}
