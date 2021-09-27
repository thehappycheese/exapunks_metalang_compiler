import React, { useEffect, useState } from 'react';


export function useLocalStorage<T>(key: string, defaultValue: T):[T,React.Dispatch<React.SetStateAction<T>>] {
	const [value, setValue] = useState(() => ((key in localStorage) ? JSON.parse(localStorage[key]) : defaultValue) as T);
	useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
	return [value, setValue];
}
