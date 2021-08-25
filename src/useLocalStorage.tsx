import { useEffect, useState } from 'react';





export function useLocalStorage(key: string, defaultValue: any) {
	const [value, setValue] = useState(() => (key in localStorage) ? JSON.parse(localStorage[key]) : defaultValue);
	useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
	return [value, setValue];
}
