import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // URL de redefinição
    const resetUrl = `${Deno.env.get("SITE_URL")}/#new-password?token=${resetToken}`;

    // Enviar e-mail
    const emailResponse = await resend.emails.send({
      from: "Emotiva <noreply@yourdomain.com>", // Substitua pelo seu domínio
      to: [email],
      subject: "Redefinir senha - Emotiva",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Redefinir sua senha</h2>
          <p>Você solicitou a redefinição de sua senha no Emotiva.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este link expira em 1 hora.<br>
            Se você não solicitou esta redefinição, ignore este e-mail.
          </p>
          <p style="color: #666; font-size: 12px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
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