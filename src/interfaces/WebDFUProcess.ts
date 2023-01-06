import type { Emitter } from "nanoevents";

export interface WebDFUProcess<T> {
  events: Emitter<T>;
}