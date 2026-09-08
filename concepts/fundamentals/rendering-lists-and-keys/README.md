# Concept: rendering lists & keys

**Category:** fundamentals
**Difficulty:** foundational
**Status:** template — expand as you work through it

## What this demonstrates

- Rendering an array with `.map()` and why each item needs a `key`.
- `key` tells React which array item a rendered element **is**, across
  re-renders — React matches old and new elements by key, not by position.
- The classic bug: keying by array **index** when the list can reorder or
  have items inserted/removed. React reuses the DOM node at that index for
  whatever item now occupies it, so any node-local state (like an
  uncontrolled `<input>`'s typed text) ends up attached to the wrong item.

Run it:

```bash
pnpm --filter concept-rendering-lists-and-keys dev
```

Open the printed local URL. Optionally edit the text in one of the inputs,
then click "Insert new item at top" and compare the two columns — the
index-keyed list's input text stays glued to its old position; the
id-keyed list's text correctly follows its own item.

## Key takeaways

- Use a stable, unique id from your data as the key — never the array
  index, unless the list is truly static (never reordered, filtered, or
  spliced into).
- Never generate a key at render time (`Math.random()`, `crypto.randomUUID()`
  inline) — a new key every render defeats keys' entire purpose and forces
  a remount every time.
- `key` isn't a prop the component receives — React consumes it itself, purely
  to match elements across renders.
- This is the same "type + position ⇒ identity" mechanism as component
  definitions (see `fundamentals/jsx-and-components`) — `key` is how you
  override "position" with an explicit identity of your own choosing.

## Discussion / interview questions

1. Why does the index-keyed list's first `<input>` keep its old text after
   a new item is inserted at the top, even though the visible label next
   to it updates correctly?
2. Would keying by index be safe if new items were only ever appended at
   the **end** of the list? Why or why not?
3. What's wrong with `key={Math.random()}` on each item, even though every
   item does get a unique key?
4. How would you key a list of items that genuinely have no natural unique
   id (e.g. a list of raw strings from an API)?

## Further reading

- [react.dev — Rendering Lists](https://react.dev/learn/rendering-lists)
- [react.dev — Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
