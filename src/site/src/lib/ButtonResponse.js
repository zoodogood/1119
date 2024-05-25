import writeError from "#site/lib/writeErrorToServer.js";

export async function ButtonResponse(source, clickEvent, callback) {
  const label = clickEvent.target.innerText;
  const { target } = clickEvent;
  const LOADING_STATE = "Брмм";
  try {
    target.innerText = LOADING_STATE;
    await callback(clickEvent);
  } catch (cause) {
    target.innerText = `Информация об ошибке записана`;
    target.title = cause.message;
    const error = new Error(`ButtonResponse with ${source}`, { cause });
    writeError(error);
    console.error(error);
    return;
  }
  label !== LOADING_STATE && (clickEvent.target.innerText = label);
}
