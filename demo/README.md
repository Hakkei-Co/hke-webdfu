# WebDFU demo

Allows you to download and download the firmware from the device in DFU mode.
Supports DFU and DfuSe.

## Usage:

- Install dependencies: `npm ci`
- Run the demo: `npm start`

## Utils

### Function: `hex4(n: number)`

Takes in a number and converts it to a hexadecimal string with a minimum length of 4.

### Function: `hexAddr8(n: number)`

Takes in a number and converts it to a hexadecimal string with a minimum length of 8, and prefix with "0x".

### Function: `niceSize(n: number)`

Takes in a number and converts it to a more readable format, using units of bytes (B), kilobytes (KiB), megabytes (MiB), or gigabytes (GiB).

### Function: `formatDFUSummary(device: WebDFU)`

Takes in an object of type `WebDFU` and returns a string with information about the device, including the mode (Runtime or DFU), vendor and product ID, configuration, interface number, alternate setting, product name, and serial number.

## Connection Functions

### Function: `onDisconnect(reason?: Error)`

This function is called when a device is disconnected. If a reason is provided (as an instance of the `Error` object), it is displayed. The function also updates the text of the "connect" button, clears some text fields, and disables certain buttons.

### Function: `onUnexpectedDisconnect(event: USBConnectionEvent)`

This function is triggered when a device is detached unexpectedly. It calls `onDisconnect()` with an error message, sets the text of the "connect" button to "Reconnect in DFU Mode", and updates the class of the "connect" and "detach" buttons.

### Function: `connect(interfaceIndex: number)`

This function is called when a connection is attempted. It calls the `connect()` method of a `webdfu` object, passing in the provided `interfaceIndex`. The function also displays various information about the device, such as its name, manufacturer, and serial number, and updates the text of the "connect" button and the state of certain buttons based on the device's capabilities.
