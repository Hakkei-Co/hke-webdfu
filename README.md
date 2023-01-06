# WebDFU

[![NPM package](https://img.shields.io/npm/v/dfu)](https://www.npmjs.com/package/dfu)
[![CI in main branch](https://github.com/Flipper-Zero/webdfu/actions/workflows/main.yml/badge.svg)](https://github.com/Flipper-Zero/webdfu/actions/workflows/main.yml)

- Reading and writing the current device firmware by [DFU 1.1](https://www.usb.org/sites/default/files/DFU_1.1.pdf)
- [ST DfuSe](http://dfu-util.sourceforge.net/dfuse.html) download and upload firmware
- Switching from the runtime configuration to the DFU bootloader (DFU detach)

## Install

```shell
npm i dfu
```

## Usage

Full example in: [webdfu/demo](https://github.com/Flipper-Zero/webdfu/tree/main/demo)

Basic example:

```javascript
import { WebDFU } from "dfu";

async function connect() {
  console.log("called connect()");
  // Load the device by WebUSB
  const selectedDevice = await navigator.usb.requestDevice({ filters: [] });

  // Create and init the WebDFU instance
  const webdfu = new WebDFU(selectedDevice, { forceInterfacesName: true });
  await webdfu.init();

  if (webdfu.interfaces.length == 0) {
    throw new Error("The selected device does not have any USB DFU interfaces.");
  }
  console.log("called webdfu()");
  // Connect to first device interface
  await webdfu.connect(0);

  console.log({
    Version: webdfu.properties.DFUVersion.toString(16),
    CanUpload: webdfu.properties.CanUpload,
    CanDownload: webdfu.properties.CanDownload,
    TransferSize: webdfu.properties.TransferSize,
    DetachTimeOut: webdfu.properties.DetachTimeOut,
  });

  // Read firmware from device
  try {
    const firmwareFile = await webdfu.read();
    console.log("Read: ", firmwareFile);
  } catch (error: e as Exception) {
    const result = (<Exception>e).Message;
    console.error(error.message);
  }

  // Write firmware in device
  try {
    // Your firmware in binary mode
    const firmwareFile = new ArrayBuffer("");
    await webdfu.write(1024, firmwareFile);

    console.log("Written!");
  } catch (error) {
    console.error(error);
  }
}

/*
  The browser's security policy requires that WebUSB be accessed only by an explicit user action.
  Add the button in your html and run the WebDFu after click in button.
  In HTML: <button id="connect-button">Connect</button>
*/
document.getElementById("connect-button").addEventListener("click", connect);
```
