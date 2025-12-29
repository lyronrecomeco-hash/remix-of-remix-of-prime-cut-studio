-- Update email_templates to focus on auth emails
DELETE FROM public.email_templates;

INSERT INTO public.email_templates (template_type, name, subject, html_content, variables, is_active) VALUES
('auth_confirm', 'Confirmação de Email', 'Confirme seu email - Barber Studio', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a227; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .button { display: inline-block; background-color: #c9a227; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
    .code { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 24px; letter-spacing: 3px; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Confirme seu email</h2>
      <p>Olá! Obrigado por se cadastrar no sistema administrativo da Barber Studio.</p>
      <p>Para ativar sua conta, clique no botão abaixo:</p>
      <center>
        <a href="{{confirmation_url}}" class="button">Confirmar Email</a>
      </center>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #999;">{{confirmation_url}}</p>
      <p><strong>Este link expira em 24 horas.</strong></p>
    </div>
    <div class="footer">
      <p>Barber Studio - Tradição e Estilo</p>
      <p>Se você não solicitou este email, ignore-o.</p>
    </div>
  </div>
</body>
</html>', '["confirmation_url", "email"]', true),

('auth_reset', 'Recuperação de Senha', 'Redefinir sua senha - Barber Studio', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a227; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .button { display: inline-block; background-color: #c9a227; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Redefinir sua senha</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <center>
        <a href="{{reset_url}}" class="button">Redefinir Senha</a>
      </center>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #999;">{{reset_url}}</p>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
    </div>
    <div class="footer">
      <p>Barber Studio - Tradição e Estilo</p>
    </div>
  </div>
</body>
</html>', '["reset_url", "email"]', true),

('auth_magic_link', 'Link Mágico', 'Seu link de acesso - Barber Studio', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a227; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .button { display: inline-block; background-color: #c9a227; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔗 Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Seu link de acesso</h2>
      <p>Use o link abaixo para acessar sua conta:</p>
      <center>
        <a href="{{magic_link_url}}" class="button">Acessar Conta</a>
      </center>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #999;">{{magic_link_url}}</p>
      <p><strong>Este link expira em 1 hora e só pode ser usado uma vez.</strong></p>
    </div>
    <div class="footer">
      <p>Barber Studio - Tradição e Estilo</p>
    </div>
  </div>
</body>
</html>', '["magic_link_url", "email"]', true),

('auth_invite', 'Convite de Usuário', 'Você foi convidado - Barber Studio', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #c9a227; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .button { display: inline-block; background-color: #c9a227; color: #1a1a2e; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #1a1a2e; color: #999; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Você foi convidado!</h2>
      <p>Você foi convidado para fazer parte da equipe administrativa da Barber Studio.</p>
      <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
      <center>
        <a href="{{invite_url}}" class="button">Aceitar Convite</a>
      </center>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; font-size: 12px; color: #999;">{{invite_url}}</p>
    </div>
    <div class="footer">
      <p>Barber Studio - Tradição e Estilo</p>
    </div>
  </div>
</body>
</html>', '["invite_url", "email"]', true);