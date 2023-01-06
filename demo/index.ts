import { WebDFUType, WebDFU } from "../index";

import { clearLog, logError, logInfo, logProgress, logWarning, setLogContext } from "./log";

// Utils
function hex4(n: number) {
  let s = n.toString(16);
  console.log("--hex4()", s)

  while (s.length < 4) {
    s = "0" + s;
  }

  return s;
}

function hexAddr8(n: number) {
  let s = n.toString(16);
  while (s.length < 8) {
    s = "0" + s;
  }
  console.log("--hexAddr8()", s)
  return "0x" + s;
}

function niceSize(n: number) {
  console.log("--niceSize()")
  const gigabyte = 1024 * 1024 * 1024;
  const megabyte = 1024 * 1024;
  const kilobyte = 1024;
  if (n >= gigabyte) {
    return n / gigabyte + "GiB";
  } else if (n >= megabyte) {
    return n / megabyte + "MiB";
  } else if (n >= kilobyte) {
    return n / kilobyte + "KiB";
  } else {
    return n + "B";
  }
}

function formatDFUSummary(device: WebDFU) {
  console.log("--formatDFUSummary()")
  const vid = hex4(device.device.vendorId);
  const pid = hex4(device.device.productId);
  const name = device.device.productName;

  let mode = "Unknown";
  if (device.currentInterfaceSettings?.alternate.interfaceProtocol == 0x01) {
    mode = "Runtime";
  } else if (device.currentInterfaceSettings?.alternate.interfaceProtocol == 0x02) {
    mode = "DFU";
  }

  const cfg = device.currentInterfaceSettings?.configuration.configurationValue;
  const intf = device.currentInterfaceSettings?.["interface"].interfaceNumber;
  const alt = device.currentInterfaceSettings?.alternate.alternateSetting;
  const serial = device.device.serialNumber;

  return `${mode}: [${vid}:${pid}] cfg=${cfg}, intf=${intf}, alt=${alt}, name="${name}" serial="${serial}"`;
}

// Current page
let webdfu: WebDFU | null = null;

const connectButton = document.querySelector("#connect") as unknown as HTMLButtonElement;
const detachButton = document.querySelector("#detach") as unknown as HTMLButtonElement;
const downloadButton = document.querySelector("#download") as unknown as HTMLButtonElement;
const uploadButton = document.querySelector("#upload") as unknown as HTMLButtonElement;
const statusDisplay = document.querySelector("#status") as unknown as HTMLDivElement;
const infoDisplay = document.querySelector("#usbInfo") as unknown as HTMLDivElement;
const dfuDisplay = document.querySelector("#dfuInfo") as unknown as HTMLDivElement;

const configForm = document.querySelector("#configForm") as unknown as HTMLFormElement;

const transferSizeField = document.querySelector("#transferSize") as unknown as HTMLInputElement;
let transferSize = parseInt(transferSizeField.value);

const dfuseStartAddressField = document.querySelector("#dfuseStartAddress") as unknown as HTMLInputElement;
const dfuseUploadSizeField = document.querySelector("#dfuseUploadSize") as unknown as HTMLInputElement;

const firmwareFileField = document.querySelector("#firmwareFile") as unknown as HTMLInputElement;
let firmwareFile: ArrayBuffer | null = null;

const downloadLog = document.querySelector("#downloadLog") as unknown as HTMLDivElement;
const uploadLog = document.querySelector("#uploadLog") as unknown as HTMLDivElement;

let manifestationTolerant = true;

function onDisconnect(reason?: Error) {
  if (reason) {
    statusDisplay.textContent = reason.message;
  }

  connectButton.textContent = "Connect";
  infoDisplay.textContent = "";
  dfuDisplay.textContent = "";
  uploadButton.disabled = false;
  detachButton.disabled = false
  downloadButton.disabled = true;
  firmwareFileField.disabled = true;
}

function onUnexpectedDisconnect(event: USBConnectionEvent) {
  console.log("--onUnexpectedDisconnect")
  if (webdfu?.device) {
    if (webdfu?.device === event.device) {
      onDisconnect(new Error("Device disconnected"));
      webdfu = null;
    }
  }
}

async function connect(interfaceIndex: number) {
  console.log("--connect")
  if (!webdfu) {
    throw new Error();
  }

  await webdfu.connect(interfaceIndex);

  let memorySummary = "";
  if (webdfu.properties) {
    const desc = webdfu.properties;

    const info = [
      `WillDetach=${webdfu.properties.WillDetach}`,
      `ManifestationTolerant=${webdfu.properties.ManifestationTolerant}`,
      `CanUpload=${webdfu.properties.CanUpload}`,
      `CanDownload=${webdfu.properties.CanDownload}`,
      `TransferSize=${webdfu.properties.TransferSize}`,
      `DetachTimeOut=${webdfu.properties.DetachTimeOut}`,
      `Version=${hex4(webdfu.properties.DFUVersion)}`,
    ];
    console.log('%c info ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ connect ⚛︎ info', info);


    dfuDisplay.textContent += "\n" + info.join(", ");
    transferSizeField.value = webdfu.properties.TransferSize.toString();
    transferSize = webdfu.properties.TransferSize;
    console.log('%c transferSize ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ connect ⚛︎ transferSize', transferSize);

    if (webdfu.properties.CanDownload) {
      manifestationTolerant = webdfu.properties.ManifestationTolerant;
    }

    if (webdfu.currentInterfaceSettings?.alternate.interfaceProtocol == 0x02) {
      if (!desc.CanUpload) {
        uploadButton.disabled = false;
        // dfuseUploadSizeField.disabled = true;
      }

      if (!desc.CanDownload) {
        downloadButton.disabled = true;
      }
    }


    if (webdfu.type === WebDFUType.SDFUse) {
      if (webdfu.dfuseMemoryInfo) {
        let totalSize = 0;
        for (const segment of webdfu.dfuseMemoryInfo.segments) {
          totalSize += segment.end - segment.start;
        }
        memorySummary = `Selected memory region: ${webdfu.dfuseMemoryInfo.name} (${niceSize(totalSize)})`;
        for (const segment of webdfu.dfuseMemoryInfo.segments) {
          const properties = [];
          if (segment.readable) {
            properties.push("readable");
          }
          if (segment.erasable) {
            properties.push("erasable");
          }
          if (segment.writable) {
            properties.push("writable");
          }
          let propertySummary = properties.join(", ");
          if (!propertySummary) {
            propertySummary = "inaccessible";
          }

          memorySummary += `\n${hexAddr8(segment.start)}-${hexAddr8(segment.end - 1)} (${propertySummary})`;
        }
      }
    }

  }

  // Clear logs
  clearLog(uploadLog);
  clearLog(downloadLog);

  // Display basic USB information
  statusDisplay.textContent = "";
  connectButton.textContent = "Disconnect";
  infoDisplay.textContent =
    `Name: ${webdfu.device.productName}\n` +
    `MFG: ${webdfu.device.manufacturerName}\n` +
    `Serial: ${webdfu.device.serialNumber}\n`;

  // Display basic dfu-util style info
  if (webdfu) {
    dfuDisplay.textContent = formatDFUSummary(webdfu) + "\n" + memorySummary;
  } else {
    dfuDisplay.textContent = "Not found";
  }

  // Update buttons based on capabilities
  if (webdfu.currentInterfaceSettings?.alternate.interfaceProtocol == 0x01) {
    // Runtime
    uploadButton.disabled = false;
    downloadButton.disabled = true;
    detachButton.disabled = false;
    firmwareFileField.disabled = true;
  } else {
    // DFU
    uploadButton.disabled = false;
    downloadButton.disabled = false;
    firmwareFileField.disabled = false;
  }
}

transferSizeField.addEventListener("change", () => {
  transferSize = parseInt(transferSizeField.value);
});

detachButton.addEventListener("click", async function () {
  console.log('--detachButton-click()')
  try {
    const res = await webdfu.detach()
    console.log('%c NOTICE ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ res', res);
  } catch(e) {
    console.error(e)
  }

});

connectButton.addEventListener("click", async function () {
  console.log("--connectButton-click()")
  if (webdfu) {
    webdfu.close().catch(console.error);
    webdfu = null;

    return;
  }

  navigator.usb
    .requestDevice({ filters: [] })
    .then(async (selectedDevice) => {
      webdfu = new WebDFU(
        selectedDevice,
        {
          forceInterfacesName: true,
        },
        {
          info: logInfo,
          warning: logWarning,
          progress: logProgress,
        }
      );
      webdfu.events.on("disconnect", onDisconnect);


      await webdfu.init();
      console.log('%c initialized webdfu instance ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ .then ⚛︎ webdfu', webdfu);

      if (webdfu.interfaces.length == 0) {
        console.log('%c interfaces ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ .then ⚛︎ webdfu.interfaces', webdfu.interfaces);
        statusDisplay.textContent = "The selected device does not have any USB DFU interfaces.";
        return;
      }

      await connect(0);
    })
    .catch((error) => {
      console.log(error);
      statusDisplay.textContent = error;
    });

});

firmwareFileField.addEventListener("change", function () {
  console.log("--firmwareFileField-change()")
  firmwareFile = null;
  if ((firmwareFileField?.files ?? []).length > 0) {
    const file = firmwareFileField.files?.[0] as Blob;
    const reader = new FileReader();
    reader.onload = function () {
      if (reader.result instanceof ArrayBuffer) {
        firmwareFile = reader.result;
      }
    };
    reader.readAsArrayBuffer(file);
  }
});

async function download(): Promise<void> {
  console.log("--download()")
  if (!configForm.checkValidity()) {
    configForm.reportValidity();
    return;
  }

  if (webdfu && firmwareFile != null) {
    setLogContext(downloadLog);
    clearLog(downloadLog);

    try {
      if (await webdfu.isError()) {
        await webdfu.clearStatus();
      }
    } catch (error) {
      logWarning("Failed to clear status");
    }

    const process = webdfu.write(transferSize, firmwareFile, manifestationTolerant);

    // Erase
    process.events.on("erase/start", () => {
      console.log("erase/start!");
      logInfo("Erasing DFU device memory");
    });

    process.events.on("erase/process", (bytesSent, expectedSize) => {
      logProgress(bytesSent, expectedSize);
    });

    process.events.on("erase/end", () => {
      logInfo("Success erased");
    });

    // Write firmware
    process.events.on("write/start", () => {
      logInfo("Copying data from browser to DFU device");
    });

    process.events.on("write/process", (bytesSent, expectedSize) => {
      logProgress(bytesSent, expectedSize);
    });

    process.events.on("write/end", (bytes_sent: number) => {
      logInfo(`Wrote ${bytes_sent} bytes`);
      logInfo("Manifesting new firmware");

      webdfu
        ?.getStatus()
        .then((status) => {
          logInfo(`Final DFU status: state=${status.state}, status=${status.status}`);
        })
        .catch((error) => {
          logError(error);
        });
    });

    process.events.on("error", (error) => {
      logError(error);
      setLogContext(null);
    });

    process.events.on("end", () => {
      logInfo("Done!");
      setLogContext(null);

      if (!manifestationTolerant) {
        webdfu
          ?.waitDisconnected(5000)
          .then(() => {
            onDisconnect();
            webdfu = null;
          })
          .catch(() => {
            // It didn't reset and disconnect for some reason...
            console.error("Device unexpectedly tolerated manifestation.");
          });
      }
    });
  }
}

downloadButton.addEventListener("click", async function (event) {
  console.log("--downloadButton-click()")
  event.preventDefault();
  event.stopPropagation();

  download().catch(console.error);
});

if (typeof navigator.usb === "undefined") {
  statusDisplay.textContent = "WebUSB not available.";
  connectButton.disabled = true;
} else {
  navigator.usb.addEventListener("disconnect", onUnexpectedDisconnect);
}
