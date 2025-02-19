export function accrue<T>(
	abort_controller: AbortController | null,
	initial,
	...pipe
): T {
	let acc = initial;
	for (const $ of pipe) {
		acc = $(acc, abort_controller);
		if (abort_controller?.signal.aborted) {
			return acc;
		}
	}

	return acc;
}

export function accrueAsync<T>(
	abort_controller: AbortController | null,
	initial,
	...pipe
): Promise<T> {
	return new Promise(async (resolve, reject) => {
		let acc = initial;
		for (const $ of pipe) {
			acc = await $(acc, abort_controller);
			if (abort_controller?.signal.aborted) {
				return resolve(acc);
			}
		}

		return resolve(acc);
	});
}


export function tap<T>(fn: (value: T) => void) {
	return (value: T) => {
		fn(value);
		return value;
	};
}

export function or_abort<T>(){
	return (value: T, abort_controller: AbortController | null) => {
		if (!value){
			abort_controller?.abort();
		}
		return value;
	}
}

export function or<T>(value: T){
	return (alternate: T) => {
		return value ?? alternate;
	}
}