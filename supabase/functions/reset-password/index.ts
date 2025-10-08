import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, newPassword }: ResetPasswordRequest = await req.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token e nova senha são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enforce password complexity requirements
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return new Response(
        JSON.stringify({ 
          error: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar senha" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Senha atualizada com sucesso" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Erro na função de reset:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);