import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  nome?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const nomeUsuario = nome || "Usuário";

    // Enviar e-mail de boas-vindas
    const emailResponse = await resend.emails.send({
      from: "Suporte Emotiva <suporte@appemotiva.com>",
      to: [email],
      subject: "Bem-vindo(a) ao Emotiva! 🎉",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Emotiva</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">Cuidando do bem-estar emocional</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
            <h2 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px 0;">Bem-vindo(a), ${nomeUsuario}! 🎉</h2>
            <p style="color: #e5e7eb; font-size: 18px; margin: 0;">Estamos muito felizes em ter você conosco na jornada do bem-estar emocional.</p>
          </div>
          
          <div style="margin-bottom: 32px;">
            <h3 style="color: #374151; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">O que você pode fazer agora:</h3>
            
            <div style="background-color: #f0f7ff; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 16px; border-radius: 8px;">
              <h4 style="color: #667eea; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">📊 Acompanhe seu bem-estar</h4>
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">Registre diariamente como você está se sentindo e acompanhe sua jornada emocional.</p>
            </div>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 16px; border-radius: 8px;">
              <h4 style="color: #0ea5e9; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">👨‍👩‍👧‍👦 Gerencie sua família</h4>
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">Adicione membros da família e acompanhe o bem-estar de todos em um só lugar.</p>
            </div>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px;">
              <h4 style="color: #22c55e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">📈 Relatórios detalhados</h4>
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">Visualize relatórios completos sobre padrões emocionais e insights importantes.</p>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
            <h3 style="color: #92400e; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">💡 Dica importante</h3>
            <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
              O bem-estar emocional é uma jornada diária. Comece registrando como você se sente hoje mesmo!
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">Pronto para começar sua jornada?</p>
            <a href="${Deno.env.get("SITE_URL") || "https://hifksggqkimdfqlhcosx.supabase.co"}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 32px; 
                      text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                      box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.3); transition: all 0.2s;">
              Acessar Emotiva
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              Precisa de ajuda? Estamos aqui para você!
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 Emotiva - Plataforma de Bem-estar Emocional<br>
              <a href="mailto:suporte@appemotiva.com" style="color: #667eea; text-decoration: none;">suporte@appemotiva.com</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("E-mail de boas-vindas enviado:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-mail de boas-vindas enviado com sucesso" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Erro na função de boas-vindas:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);