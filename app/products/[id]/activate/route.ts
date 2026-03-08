import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      is_active: true,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/products?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/products?updated=1", request.url));
}