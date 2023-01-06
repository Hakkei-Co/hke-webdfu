let logContext: HTMLDivElement | null = null;

export function setLogContext(div: HTMLDivElement | null): void {
  console.log("--setLogContext()")
  logContext = div;
}

export function clearLog(context = logContext): void {
  console.log("--clearLog()")
  if (context) {
    context.innerHTML = "";
  }
}

export function logInfo(msg: string): void {
  console.log('%c logContext ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ logInfo ⚛︎ logContext', logContext);
  if (logContext) {
    const info = document.createElement("p");
    info.className = "info";
    info.textContent = msg;
    console.log("--logInfo()", msg)
    logContext.appendChild(info);
  }
}

export function logWarning(msg: string): void {
  console.log("--logWarning()")
  if (logContext) {
    const warning = document.createElement("p");
    warning.className = "warning";
    warning.textContent = msg;
    logContext.appendChild(warning);
  }
}

export function logError(msg: string): void {
  console.log("--logError()")
  console.error(msg);
  if (logContext) {
    const error = document.createElement("p");
    error.className = "error";
    error.textContent = msg;
    logContext.appendChild(error);
  }
}

export function logProgress(done: number, total?: number): void {
  console.log("--logProgress()", done, total)
  if (logContext) {
    let progressBar: HTMLProgressElement | null = null;
    if (logContext?.lastElementChild?.tagName.toLowerCase() == "progress") {
      progressBar = logContext.lastElementChild as HTMLProgressElement;
    }

    if (!progressBar) {
      const progressBar = document.createElement("progress");
      logContext.appendChild(progressBar);
    } else {
      progressBar.value = done;
      if (total !== undefined) {
        progressBar.max = total;
      }
    }
  }
}
