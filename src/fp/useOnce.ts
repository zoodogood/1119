export function useOnce<T>(initializer: () => T): () => T {
	let _value: T
	return () => _value ||= initializer()
}
