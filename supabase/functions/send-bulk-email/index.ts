import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name: string;
}

interface BulkEmailRequest {
  templateId: string;
  templateType: string;
  recipients: Recipient[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { templateId, templateType, recipients }: BulkEmailRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      throw new Error("Nenhum destinatário fornecido");
    }

    console.log(`Sending bulk email to ${recipients.length} recipients`);

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      throw new Error("Template não encontrado");
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails
    for (const recipient of recipients) {
      try {
        let htmlContent = template.html_content;
        
        // Replace variables
        htmlContent = htmlContent.replace(/\{\{name\}\}/g, recipient.name);
        htmlContent = htmlContent.replace(/\{\{email\}\}/g, recipient.email);
        htmlContent = htmlContent.replace(/\{\{dashboard_url\}\}/g, `${supabaseUrl.replace('.supabase.co', '')}/dashboard`);
        htmlContent = htmlContent.replace(/\{\{promo_url\}\}/g, `${supabaseUrl.replace('.supabase.co', '')}/promo`);
        htmlContent = htmlContent.replace(/\{\{action_url\}\}/g, `${supabaseUrl.replace('.supabase.co', '')}`);

        const emailResult = await resend.emails.send({
          from: "Barber Studio <noreply@genesishub.cloud>",
          to: [recipient.email],
          subject: template.subject.replace(/\{\{name\}\}/g, recipient.name),
          html: htmlContent,
        });

        if (emailResult.error) {
          results.failed++;
          results.errors.push(`${recipient.email}: ${emailResult.error.message}`);
        } else {
          results.sent++;
          
          // Log email
          await supabase.from("email_logs").insert({
            recipient_email: recipient.email,
            recipient_name: recipient.name,
            subject: template.subject,
            template_type: templateType,
            status: "sent",
          });
        }

        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipient.email}: ${error.message}`);
      }
    }

    console.log(`Bulk email complete: ${results.sent} sent, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.sent, 
        failed: results.failed,
        errors: results.errors.slice(0, 5) 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Bulk email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
