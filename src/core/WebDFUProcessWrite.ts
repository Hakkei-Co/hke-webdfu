import { createNanoEvents } from "nanoevents";
import { WebDFUProcess } from "../interfaces";
import { WebDFUProcessWriteEvents } from "../types";

export class WebDFUProcessWrite implements WebDFUProcess<WebDFUProcessWriteEvents> {
  events = createNanoEvents<WebDFUProcessWriteEvents>();
}

