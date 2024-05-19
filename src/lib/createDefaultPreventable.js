export function createDefaultPreventable() {
  let isPrevented = false;
  const defaultPrevented = () => isPrevented;
  const preventDefault = () => {
    isPrevented = true;
  };
  return { defaultPrevented, preventDefault };
}
