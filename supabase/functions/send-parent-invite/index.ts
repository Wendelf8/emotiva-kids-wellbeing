import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  responsavelEmail: string;
  alunoNome: string;
  escolaNome: string;
  alunoId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { responsavelEmail, alunoNome, escolaNome, alunoId }: InviteRequest = await req.json();

    console.log("Enviando convite para:", responsavelEmail);

    const appUrl = Deno.env.get("WEBAPP_URL") || "https://hifksggqkimdfqlhcosx.supabase.co";

    const emailResponse = await resend.emails.send({
      from: `${Deno.env.get("SENDER_NAME") || "Emotiva"} <${Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev"}>`,
      to: [responsavelEmail],
      subject: `Convite para acompanhar ${alunoNome} - ${escolaNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B5CF6;">Convite da Escola ${escolaNome}</h1>
          <p>Olá!</p>
          <p>Você foi convidado(a) pela escola <strong>${escolaNome}</strong> para acompanhar o bem-estar emocional de <strong>${alunoNome}</strong> através da plataforma Emotiva.</p>
          
          <p>Com o Emotiva, você poderá:</p>
          <ul>
            <li>Acompanhar os check-ins emocionais diários</li>
            <li>Ver relatórios e estatísticas</li>
            <li>Receber alertas importantes</li>
            <li>Compartilhar informações com profissionais de saúde mental</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/#/register?email=${encodeURIComponent(responsavelEmail)}" 
               style="background-color: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Aceitar Convite e Criar Conta
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Se você já possui uma conta, faça login e o vínculo será estabelecido automaticamente.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Este é um e-mail automático. Se você não esperava receber este convite, por favor ignore esta mensagem.
          </p>
        </div>
      `,
    });

    console.log("E-mail enviado com sucesso:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar convite:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
