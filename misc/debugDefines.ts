export type COM = "shutdown";
export type StatusCode = "OK" | "ERR";

export interface ViteMessage {
  com: COM;
}

export interface FloorpMessage {
  com: COM;
  statusCode: StatusCode;
}
