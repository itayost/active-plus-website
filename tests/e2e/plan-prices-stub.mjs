// The e2e server's web_plans. Its Supabase host never resolves, and the
// /payment page reads the prices on the server, where page.route cannot
// answer, so PLAN_PRICES_URL points the read here. Usage: node plan-prices-stub.mjs <port>
import { createServer } from "node:http";

const ROWS = [
  { plan_type: "ANNUAL", total_nis: 828, max_installments: 12 },
  { plan_type: "MONTHLY", total_nis: 99, max_installments: 1 },
];

const port = Number(process.argv[2]);
createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(ROWS));
}).listen(port, "127.0.0.1");
