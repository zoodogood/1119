import {
  destroy_component,
  detach,
  insert,
  is_function,
  mount_component,
  noop,
  SvelteComponent,
} from "svelte/internal";

function resolveSlotFn([element, props = {}]) {
  if (is_function(element) && element.prototype instanceof SvelteComponent) {
    let component;
    return function () {
      return {
        c: noop,
        m(target, anchor) {
          component = new element({ target, props });
          mount_component(component, target, anchor, null);
        },
        d(detaching) {
          destroy_component(component, detaching);
        },
        l: noop,
      };
    };
  } else {
    return function () {
      return {
        c: noop,
        m: function mount(target, anchor) {
          insert(target, element, anchor);
        },
        d: function destroy(detaching) {
          if (detaching) {
            detach(element);
          }
        },
        l: noop,
      };
    };
  }
}

// https://github.com/sveltejs/svelte/issues/2588#issuecomment-1134612872
export function createSlots(slots) {
  const svelteSlots = {};

  for (const slotName in slots) {
    svelteSlots[slotName] = [resolveSlotFn(slots[slotName])];
  }

  return svelteSlots;
}
