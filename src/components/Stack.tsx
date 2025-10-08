import { Artist } from "@/types";
import { useState } from "react";

function useStack() {
  const [stack, setStack] = useState<Artist[][]>([]);
  const [itemSet, setItemSet] = useState<Set<String>>(new Set([]));

  const push = (items: Artist[]) => {
    setStack((prev) => [...prev, items]);
    setItemSet((prev) => new Set(prev).add(items[0].name));
  };

  const pop = (): Artist[] | Artist[] => {
    if (stack.length === 0) throw new Error("Cannot pop from empty stack");
    const item = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    setItemSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(item[0].name);
      return newSet;
    });
    return item;
  };

  const peek = (): Artist[] | undefined => {
    return stack.length > 0 ? stack[stack.length - 1] : undefined;
  };

  const clear = () => {
    setStack([]);
    setItemSet(new Set());
  };

  const contains = (item: string) => {
    return itemSet.has(item);
  };

  const size = stack.length;
  const isEmpty = stack.length === 0;

  return {
    stack,
    push,
    pop,
    peek,
    clear,
    contains,
    size,
    isEmpty,
  };
}

export default useStack;
