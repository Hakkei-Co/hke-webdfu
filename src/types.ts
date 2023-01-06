/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
export type DFUseMemorySegment = {
  start: number;
  end: number;
  sectorSize: number;

  readable: boolean;
  erasable: boolean;
  writable: boolean;
};

export enum DFUseCommands {
  GET_COMMANDS = 0x00,
  SET_ADDRESS = 0x21,
  ERASE_SECTOR = 0x41,
}

export type WebDFUSettings = {
  name?: string;
  configuration: USBConfiguration;
  interface: USBInterface;
  alternate: USBAlternateInterface;
};

export type WebDFUDeviceDescriptor = {
  bLength: number;
  bDescriptorType: number;
  bcdUSB: number;
  bDeviceClass: number;
  bDeviceSubClass: number;
  bDeviceProtocol: number;
  bMaxPacketSize: number;
  idVendor: number;
  idProduct: number;
  bcdDevice: number;
  iManufacturer: number;
  iProduct: number;
  iSerialNumber: number;
  bNumConfigurations: number;
};

export type WebDFUFunctionalDescriptor = {
  bLength: number;
  bDescriptorType: number;
  bmAttributes: number;
  wDetachTimeOut: number;
  wTransferSize: number;
  bcdDFUVersion: number;
};

export type WebDFUConfigurationDescriptor = {
  bLength: number,
  bDescriptorType: number,
  wTotalLength: number,
  bNumInterfaces: number,
  bConfigurationValue: number,
  iConfiguration: number,
  bmAttributes: unknown,
  bMaxPower: number,
  descriptors: Array<any | string>
};

export type WebDFUInterfaceDescriptor = {
  bLength: number;
  bDescriptorType: number;
  bInterfaceNumber: number;
  bAlternateSetting: number;
  bNumEndpoints: number;
  bInterfaceClass: number;
  bInterfaceSubClass: number;
  bInterfaceProtocol: number;
  iInterface: number;
  descriptors: (WebDFUFunctionalDescriptor | WebDFUInterfaceSubDescriptor)[];
};

export type WebDFUInterfaceSubDescriptor = {
  descData: DataView;
  bLength: number;
  bDescriptorType: number;
  bmAttributes: number;
  wDetachTimeOut: number;
  wTransferSize: number;
  bcdDFUVersion: number;
};

export type WebDFUEvent = {
  init: () => void;
  connect: () => void;
  disconnect: (error?: Error) => void;
};

export type WebDFUOptions = {
  forceInterfacesName?: boolean;
};

export type WebDFUProperties = {
  WillDetach: boolean;
  ManifestationTolerant: boolean;
  CanUpload: boolean;
  CanDownload: boolean;
  TransferSize: number;
  DetachTimeOut: number;
  DFUVersion: number;
};

export type WebDFULog = Record<"info" | "warning", (msg: string) => void> & {
  progress: (done: number, total?: number) => void;
};

export type WebDFUProcessReadEvents = {
  process: (done: number, total?: number) => void;
  error: (error: unknown) => void;
  end: (data: Blob) => void;
};

export type WebDFUProcessWriteEvents = {
  "erase/start": () => void;
  "erase/process": WebDFUProcessEraseEvents["process"];
  "erase/end": WebDFUProcessEraseEvents["end"];

  "write/start": () => void;
  "write/process": (bytesSent: number, expectedSize: number) => void;
  "write/end": (bytesSent: number) => void;

  verify: (status: { status: number; pollTimeout: number; state: number }) => void;

  error: (error) => void;
  end: () => void;
};

export type WebDFUProcessEraseEvents = {
  process: (bytesSent: number, expectedSize: number) => void;
  error: (error: any) => void;
  end: () => void;
};