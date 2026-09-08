import { useCallback, useState } from "react";

/**
 * Custom hook: useToggle
 *
 * A custom hook is nothing more than a JavaScript function whose name
 * starts with `use` and that calls other hooks internally — there's no
 * separate "define a hook" API in React beyond that convention. Because
 * this function calls `useState` inside its body, it becomes subject to
 * the Rules of Hooks itself:
 *
 *   - It may only be called from the top level of a React function
 *     component, or from the top level of another custom hook — never
 *     inside a condition, loop, or nested callback.
 *   - It may only be called from a React function component or another
 *     hook — never from a plain helper function.
 *
 * That second rule is exactly why this logic *has* to live in a hook: a
 * plain function like `function makeToggle() { return useState(false); }`
 * would break immediately if called from a regular event handler, a
 * module-level utility, or a class method, because `useState` only works
 * while React is rendering a component/hook and can track the call by its
 * position in that render. Naming this function `useToggle` and calling it
 * at the top level of each widget below is what makes it legal.
 */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setOn = useCallback(() => setValue(true), []);
  const setOff = useCallback(() => setValue(false), []);

  return { value, toggle, setOn, setOff };
}
