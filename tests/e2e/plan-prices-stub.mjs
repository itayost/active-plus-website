// The e2e build's NEXT_PUBLIC_SUPABASE_URL. The browser's Supabase calls never
// get here (page.route answers them by host), but /payment reads web_plans on
// the server, where page.route cannot reach: this answers that read as
// PostgREST would. Every other server-side call (the middleware's getUser) is
// dropped, the network failure the old unresolvable host gave.
// Usage: node plan-prices-stub.mjs <port>
import { createServer } from "node:http";

const ROWS = [
  { plan_type: "ANNUAL", total_nis: 828, max_installments: 12 },
  { plan_type: "MONTHLY", total_nis: 99, max_installments: 1 },
];

const port = Number(process.argv[2]);
createServer((req, res) => {
  if (req.method === "GET" && new URL(req.url ?? "/", "http://stub").pathname === "/rest/v1/web_plans") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(ROWS));
    return;
  }
  req.socket.destroy();
}).listen(port, "127.0.0.1");
