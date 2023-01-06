import { createNanoEvents } from "nanoevents";
import { WebDFUProcess } from "../interfaces";
import { WebDFUProcessEraseEvents } from "../types";


export class WebDFUProcessErase implements WebDFUProcess<WebDFUProcessEraseEvents> {
  events = createNanoEvents<WebDFUProcessEraseEvents>();
}

