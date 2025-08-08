import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "Emotiva";
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "no-reply@appemotiva.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de e-mail inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);

    if (userError || !user) {
      // Por segurança, sempre retornar sucesso mesmo se usuário não existir
      console.log(`Tentativa de reset para e-mail inexistente: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, um link de redefinição será enviado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Gerar token único para reset
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco (você pode criar uma tabela para isso)
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error("Erro ao salvar token:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // URL de redefinição - usando a URL atual da aplicação
    const siteUrl = Deno.env.get("SITE_URL") || "https://hifksggqkimdfqlhcosx.supabase.co";
    const resetUrl = `${siteUrl}/#new-password?token=${resetToken}`;

    // Enviar e-mail
    const emailResponse = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [email],
      subject: "Redefinir sua senha - Emotiva",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Emotiva</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">Cuidando do bem-estar emocional</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
            <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">Redefinir sua senha</h2>
            <p style="color: #e5e7eb; font-size: 16px; margin: 0 0 24px 0;">Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha.</p>
            
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #ffffff; color: #667eea; padding: 16px 32px; 
                      text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                      box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1); transition: all 0.2s;">
              Redefinir Minha Senha
            </a>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <h3 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">⏰ Importante:</h3>
            <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Este link expira em <strong>1 hora</strong></li>
              <li>Se você não solicitou esta redefinição, pode ignorar este e-mail</li>
              <li>Sua senha atual permanece ativa até que você defina uma nova</li>
            </ul>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              Problema com o botão? Copie e cole este link no seu navegador:
            </p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 0;">
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 Emotiva - Plataforma de Bem-estar Emocional<br>
              <a href="mailto:suporte@appemotiva.com" style="color: #667eea; text-decoration: none;">suporte@appemotiva.com</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("E-mail de redefinição enviado:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-mail de redefinição enviado com sucesso" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Erro na função de redefinição:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);