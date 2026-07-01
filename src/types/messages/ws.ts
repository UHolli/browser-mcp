import type { ElementParams } from "@/types/mcp/tool";

export type ConsoleLogEntry = Record<string, unknown>;

export interface SocketMessageMap {
  [key: string]: { payload: unknown; result: unknown };
  browser_navigate: { payload: { url: string }; result: void };
  browser_go_back: { payload: Record<string, never>; result: void };
  browser_go_forward: { payload: Record<string, never>; result: void };
  browser_wait: { payload: { time: number }; result: void };
  browser_press_key: { payload: { key: string }; result: void };
  browser_snapshot: { payload: Record<string, never>; result: string };
  browser_click: { payload: ElementParams; result: void };
  browser_drag: {
    payload: {
      startElement: string;
      startRef: string;
      endElement: string;
      endRef: string;
    };
    result: void;
  };
  browser_hover: { payload: ElementParams; result: void };
  browser_type: {
    payload: ElementParams & { text: string; submit: boolean };
    result: void;
  };
  browser_select_option: {
    payload: ElementParams & { values: string[] };
    result: void;
  };
  browser_get_console_logs: {
    payload: Record<string, never>;
    result: ConsoleLogEntry[];
  };
  browser_screenshot: { payload: Record<string, never>; result: string };
  getUrl: { payload: undefined; result: string };
  getTitle: { payload: undefined; result: string };
}

export type MessageType<T extends Record<string, { payload: unknown }>> =
  keyof T & string;

export type MessagePayload<
  T extends Record<string, { payload: unknown }>,
  K extends MessageType<T>,
> = T[K]["payload"];

export type MessageResult<
  T extends Record<string, { payload: unknown; result: unknown }>,
  K extends MessageType<T>,
> = T[K]["result"];
