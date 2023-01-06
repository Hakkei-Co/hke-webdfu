import { WebDFUError } from "../core/WebDFUError";
import { DFUseMemorySegment, WebDFUConfigurationDescriptor, WebDFUDeviceDescriptor, WebDFUFunctionalDescriptor, WebDFUInterfaceDescriptor, WebDFUInterfaceSubDescriptor } from "../types";

// Parse descriptors
export function parseMemoryDescriptor(desc: string): { name: string; segments: DFUseMemorySegment[] } {
  console.log('%c NOTICE ⏰ ', 'background:#6e6e6e; color: #cdfdce;, ⚛︎ parseMemoryDescriptor ⚛︎ desc', desc);

  const nameEndIndex = desc.indexOf("/");
  // if (!desc.startsWith("@") || nameEndIndex == -1) {
  //   throw new WebDFUError(`Not a DfuSe memory descriptor: "${desc}"`);
  // }

  const name = desc.substring(1, nameEndIndex).trim();
  const segmentString = desc.substring(nameEndIndex);

  const segments = [];

  const sectorMultipliers: Record<string, number> = {
    " ": 1,
    B: 1,
    K: 1024,
    M: 1048576,
  };

  const contiguousSegmentRegex = /\/\s*(0x[0-9a-fA-F]{1,8})\s*\/(\s*[0-9]+\s*\*\s*[0-9]+\s?[ BKM]\s*[abcdefg]\s*,?\s*)+/g;
  let contiguousSegmentMatch: RegExpExecArray | null;
  while ((contiguousSegmentMatch = contiguousSegmentRegex.exec(segmentString))) {
    const segmentRegex = /([0-9]+)\s*\*\s*([0-9]+)\s?([ BKM])\s*([abcdefg])\s*,?\s*/g;
    let startAddress = parseInt(contiguousSegmentMatch?.[1] ?? "", 16);
    let segmentMatch: RegExpExecArray | null;
    while ((segmentMatch = segmentRegex.exec(contiguousSegmentMatch[0]!))) {
      const sectorCount = parseInt(segmentMatch[1]!, 10);
      const sectorSize = parseInt(segmentMatch[2]!) * (sectorMultipliers[segmentMatch?.[3] ?? ""] ?? 0);
      const properties = (segmentMatch?.[4] ?? "")?.charCodeAt(0) - "a".charCodeAt(0) + 1;

      const segment = {
        start: startAddress,
        sectorSize: sectorSize,
        end: startAddress + sectorSize * sectorCount,
        readable: (properties & 0x1) != 0,
        erasable: (properties & 0x2) != 0,
        writable: (properties & 0x4) != 0,
      };

      segments.push(segment);

      startAddress += sectorSize * sectorCount;
    }
  }

  return { name, segments };
}

export function parseDeviceDescriptor(data: DataView): WebDFUDeviceDescriptor {
  return {
    bLength: data.getUint8(0),
    bDescriptorType: data.getUint8(1),
    bcdUSB: data.getUint16(2, true),
    bDeviceClass: data.getUint8(4),
    bDeviceSubClass: data.getUint8(5),
    bDeviceProtocol: data.getUint8(6),
    bMaxPacketSize: data.getUint8(7),
    idVendor: data.getUint16(8, true),
    idProduct: data.getUint16(10, true),
    bcdDevice: data.getUint16(12, true),
    iManufacturer: data.getUint8(14),
    iProduct: data.getUint8(15),
    iSerialNumber: data.getUint8(16),
    bNumConfigurations: data.getUint8(17),
  };
}

export function parseFunctionalDescriptor(data: DataView): WebDFUFunctionalDescriptor {
  return {
    bLength: data.getUint8(0),
    bDescriptorType: data.getUint8(1),
    bmAttributes: data.getUint8(2),
    wDetachTimeOut: data.getUint16(3, true),
    wTransferSize: data.getUint16(5, true),
    bcdDFUVersion: data.getUint16(7, true),
  };
}

export function parseInterfaceDescriptor(data: DataView): WebDFUInterfaceDescriptor {
  return {
    bLength: data.getUint8(0),
    bDescriptorType: data.getUint8(1),
    bInterfaceNumber: data.getUint8(2),
    bAlternateSetting: data.getUint8(3),
    bNumEndpoints: data.getUint8(4),
    bInterfaceClass: data.getUint8(5),
    bInterfaceSubClass: data.getUint8(6),
    bInterfaceProtocol: data.getUint8(7),
    iInterface: data.getUint8(8),
    descriptors: [],
  };
}

export function parseSubDescriptors(descriptorData: DataView): Array<string> {
  const DT_INTERFACE = 4;
  // const DT_ENDPOINT = 5;
  const DT_DFU_FUNCTIONAL = 0x21;
  const USB_CLASS_APP_SPECIFIC = 0xfe;
  const USB_SUBCLASS_DFU = 0x01;

  let remainingData: DataView = descriptorData;
  const descriptors = [];
  let currIntf;
  let inDfuIntf = false;

  while (remainingData.byteLength > 2) {
    const bLength = remainingData.getUint8(0);
    const bDescriptorType = remainingData.getUint8(1);
    const descData = new DataView(remainingData.buffer.slice(0, bLength));
    if (bDescriptorType == DT_INTERFACE) {
      currIntf = parseInterfaceDescriptor(descData);
      if (currIntf.bInterfaceClass == USB_CLASS_APP_SPECIFIC && currIntf.bInterfaceSubClass == USB_SUBCLASS_DFU) {
        inDfuIntf = true;
      } else {
        inDfuIntf = false;
      }
      descriptors.push(currIntf);
    } else if (inDfuIntf && bDescriptorType == DT_DFU_FUNCTIONAL) {
      const funcDesc = parseFunctionalDescriptor(descData);
      descriptors.push(funcDesc);
      currIntf?.descriptors.push(funcDesc);
    } else {
      const desc = {
        bLength: bLength,
        bDescriptorType: bDescriptorType,
        descData: descData,
      } as WebDFUInterfaceSubDescriptor;
      descriptors.push(desc);
      if (currIntf) {
        currIntf.descriptors.push(desc);
      }
    }
    remainingData = new DataView(remainingData.buffer.slice(bLength));
  }

  return descriptors;
}

export function parseConfigurationDescriptor(data: DataView): WebDFUConfigurationDescriptor {
  const descriptorData = new DataView(data.buffer.slice(9));
  const descriptors = parseSubDescriptors(descriptorData);

  return {
    bLength: data.getUint8(0),
    bDescriptorType: data.getUint8(1),
    wTotalLength: data.getUint16(2, true),
    bNumInterfaces: data.getUint8(4),
    bConfigurationValue: data.getUint8(5),
    iConfiguration: data.getUint8(6),
    bmAttributes: data.getUint8(7),
    bMaxPower: data.getUint8(8),
    descriptors: descriptors,
  };
}