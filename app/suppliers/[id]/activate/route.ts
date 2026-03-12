import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login`, request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.redirect(
      new URL(
        `/suppliers/${id}?error=${encodeURIComponent("Len admin môže aktivovať dodávateľov.")}`,
        request.url
      )
    );
  }

  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/suppliers/${id}?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(`/suppliers/${id}?updated=1`, request.url));
}