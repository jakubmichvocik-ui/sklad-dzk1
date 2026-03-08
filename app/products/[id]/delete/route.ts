import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  await supabase
    .from("products")
    .delete()
    .eq("id", id);

  return NextResponse.redirect(new URL("/products", request.url));
}