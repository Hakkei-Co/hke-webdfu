import { createNanoEvents } from "nanoevents";
import { WebDFUProcess } from "../interfaces";
import { WebDFUProcessReadEvents } from "../types";

export class WebDFUProcessRead implements WebDFUProcess<WebDFUProcessReadEvents> {
  events = createNanoEvents<WebDFUProcessReadEvents>();
}