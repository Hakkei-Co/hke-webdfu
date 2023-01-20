# WebDFU

References
- https://github.com/Flipper-Zero/webdfu/ (2021)
- https://github.com/devanlai/webdfu (2017)

[![NPM package](https://img.shields.io/npm/v/dfu)](https://www.npmjs.com/package/dfu)
[![CI in main branch](https://github.com/Flipper-Zero/webdfu/actions/workflows/main.yml/badge.svg)](https://github.com/Flipper-Zero/webdfu/actions/workflows/main.yml)

- Reading and writing the current device firmware by [DFU 1.1](https://www.usb.org/sites/default/files/DFU_1.1.pdf)
- Switching from the runtime configuration to the DFU bootloader (DFU detach)

## Install

```shell
npm i @hakkei/webdfu
```

## Usage

Full example in: [webdfu/demo](https://github.com/hakkei-co/hke-webdfu/tree/main/demo)

Demo: https://dfu.hakkei.wiki


# WebDFU

## Properties

- `events`: An instance of `NanoEvents` that can be used to listen for different events, such as `init`, `connect`, and `disconnect`.
- `interfaces`: An array of `WebDFUSettings` objects representing the DFU interfaces present on the device.
- `properties`: An object containing the properties of the DFU functional descriptor, if present.
- `connected`: A boolean indicating whether the class is currently connected to a device.
- `currentInterfaceSettings`: The settings of the currently selected DFU interface.

## Methods

### `constructor(device: USBDevice, settings?: WebDFUOptions, log?: WebDFULog)`

Creates a new instance of the `WebDFU` class.

### `get type(): number`

Returns the type of DFU interface, either `WebDFUType.DFU` or `WebDFUType.SDFUse`

### `async init(): Promise<void>`

Initializes the class by finding the DFU interfaces present on the device.

### `async connect(interfaceIndex: number): Promise<void>`

Connects to the specified DFU interface on the device. Throws an error if the interface is not found or if there is an error connecting.

### `async close(): Promise<void>`

Closes the connection to the device and emits a `disconnect` event.

### `read(xferSize: number, maxSize: number): WebDFUProcessRead`

Reads data from the device with a specified transfer size and maximum size. Returns a `WebDFUProcessRead` object that can be used to listen for events such as `end` and `error`.

### `write(xfer_size: number, data: ArrayBuffer, manifestationTolerant: boolean): WebDFUProcessWrite`

Writes data to the device with a specified transfer size and a boolean indicating whether the write should be manifestation tolerant. Returns a `WebDFUProcessWrite` object that can be used to listen for events such as `end` and `error`.

### `private async getDFUDescriptorProperties(): Promise<WebDFUProperties | null>`

Attempts to read the DFU functional descriptor from the device. Returns an object containing the properties of the descriptor, or `null` if the descriptor is not present.

### `private async findDfuInterfaces(): Promise<WebDFUSettings[]>`

Searches for DFU interfaces on the device and returns an array of `WebDFUSettings` objects.

### `private async fixInterfaceNames(interfaces: WebDFUSettings[]): Promise<void>`

Forces the interface names of the device if specified by the settings.

### `private async readStringDescriptor(index: number, langID = 0)`

Reads the string descriptor with the specified index and language ID from the device. Returns the descriptor as an array of 16-bit words if langID is 0, otherwise returns the descriptor as a string.

### `private async readDeviceDescriptor(): Promise<DataView>`

Reads the device descriptor from the device. Returns a DataView object.

### `private async readInterfaceNames()`

Reads the interface names from the device and returns an object that maps the interface index to the corresponding interface name.



