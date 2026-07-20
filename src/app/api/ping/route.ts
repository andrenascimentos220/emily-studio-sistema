import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Dá um "cutucão" no banco puxando apenas 1 ID para gerar atividade real
    const { data, error } = await supabase.from("servicos").select("id").limit(1);

    if (error) throw error;

    return NextResponse.json(
      { 
        status: "Supabase Acordado! ⏰", 
        timestamp: new Date().toISOString() 
      }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "Erro ao acordar o banco", error }, 
      { status: 500 }
    );
  }
}