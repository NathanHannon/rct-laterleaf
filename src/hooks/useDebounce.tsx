import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value. It will only update the returned
 * value if the input value has not changed for the specified delay.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes before the delay has passed,
        // or if the component unmounts.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run the effect only if the value or delay changes

    return debouncedValue;
}