import type { nsICommandLine } from "../../../@types/firefox/toolkit/components/commandlines/nsICommandLine";
import type { nsICommandLineHandler } from "../../../@types/firefox/toolkit/components/commandlines/nsICommandLineHandler";

import type {
  ViteMessage,
  COM,
  FloorpMessage,
} from "../../../misc/debugDefines";
export class FloorpDebugCommandlineHandler implements nsICommandLineHandler {
  QueryInterface = ChromeUtils.generateQI([Ci.nsICommandLineHandler]);

  handle(aCommandLine: nsICommandLine) {
    const arg = aCommandLine.handleFlagWithParam("floorp-debug", false);
    if (arg) {
      startViteHandler(Number(arg));
    }
  }
  readonly helpInfo = `-floorp-debug [WebSocketPort]
Port to Listen to Debug Floorp esp. Vite dev server`;
}

async function startViteHandler(port: number) {
  const ws = new WebSocket(`ws://localhost:${port}`);
  ws.onmessage = ev => {
    if (!(ev.data instanceof ArrayBuffer)) {
      const mes = JSON.parse(ev.data as string) as ViteMessage;

      switch (mes.com) {
        case "restart": {
          const res: FloorpMessage = { com: mes.com, statusCode: "OK" };
          ws.send(JSON.stringify(res));
          ws.close();
          Services.startup.quit(
            Services.startup.eForceQuit | Services.startup.eRestart,
            0
          );
        }
      }
    }
  };
}
