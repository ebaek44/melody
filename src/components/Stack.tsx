import { useState } from "react";

function useStack() {
  const [stack, setStack] = useState<String[]>([]);
  const [itemSet, setItemSet] = useState<Set<String>>(new Set([]));

  const push = (item: String) => {
    setStack((prev) => [...prev, item]);
    setItemSet((prev) => new Set(prev).add(item));
  };

  const pop = (): String | undefined => {
    if (stack.length === 0) return undefined;
    const item = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    setItemSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
    return item;
  };

  const peek = (): String | undefined => {
    return stack.length > 0 ? stack[stack.length - 1] : undefined;
  };

  const clear = () => {
    setStack([]);
    setItemSet(new Set());
  };

  const contains = () => {};

  const size = stack.length;
  const isEmpty = stack.length === 0;

  return {
    stack,
    push,
    pop,
    peek,
    clear,
    size,
    isEmpty,
  };
}

export default useStack;
