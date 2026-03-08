import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: existingLocation, error: checkError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", id)
    .single();

  if (checkError || !existingLocation) {
    return NextResponse.redirect(
      new URL(`/locations?error=${encodeURIComponent("Lokácia neexistuje alebo ju nemožno načítať.")}`, request.url)
    );
  }

  const { data: deletedRows, error: deleteError } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .select("id");

  if (deleteError) {
    console.error("Delete location error:", deleteError.message);
    return NextResponse.redirect(
      new URL(`/locations?error=${encodeURIComponent(deleteError.message)}`, request.url)
    );
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.redirect(
      new URL(
        `/locations?error=${encodeURIComponent("Lokácia nebola zmazaná. Pravdepodobne chýba DELETE policy alebo je lokácia viazaná na iné záznamy.")}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(new URL("/locations?deleted=1", request.url));
}