import { NURTURE_DESTINATION, recordNurtureClick } from "@/lib/nurture/click";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await params;
  await recordNurtureClick(token, { url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY });
  return Response.redirect(new URL(NURTURE_DESTINATION, request.url), 302);
}
