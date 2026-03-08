import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { error } = await supabase.rpc("complete_inventory_session", {
    p_session_id: id,
  });

  if (error) {
    console.error("Complete inventory error:", error.message);
  }

  return NextResponse.redirect(new URL(`/inventory/${id}`, request.url));
}