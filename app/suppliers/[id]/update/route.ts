import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const contact_person = String(formData.get("contact_person") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!name) {
    return NextResponse.redirect(
      new URL(
        `/suppliers/${id}?error=${encodeURIComponent("Chýba názov dodávateľa.")}`,
        request.url
      )
    );
  }

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
        `/suppliers/${id}?error=${encodeURIComponent("Len admin môže upravovať dodávateľov.")}`,
        request.url
      )
    );
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      code: code || null,
      email: email || null,
      phone: phone || null,
      contact_person: contact_person || null,
      address: address || null,
      note: note || null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/suppliers/${id}?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(`/suppliers/${id}?updated=1`, request.url));
}