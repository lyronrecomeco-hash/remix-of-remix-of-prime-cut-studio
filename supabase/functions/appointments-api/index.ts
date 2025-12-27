import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const eventType = url.searchParams.get('event');
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    console.log('API request:', { eventType, date });

    // Get shop settings
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select('name')
      .limit(1)
      .single();

    const shopName = shopSettings?.name || 'Barbearia';

    // Get message template
    let template = '';
    if (eventType) {
      const { data: templateData } = await supabase
        .from('message_templates')
        .select('template')
        .eq('event_type', eventType)
        .single();
      template = templateData?.template || '';
    }

    // Base query for appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        protocol,
        client_name,
        client_phone,
        date,
        time,
        status,
        created_at,
        services:service_id (name, duration, price),
        barbers:barber_id (name)
      `)
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('time', { ascending: true });

    // Filter by event type
    if (eventType === 'appointment_created') {
      query = query.eq('status', 'pending');
    } else if (eventType === 'appointment_confirmed') {
      query = query.in('status', ['confirmed', 'inqueue']);
    } else if (eventType === 'client_called') {
      query = query.eq('status', 'called');
    } else if (eventType === 'appointment_completed') {
      query = query.eq('status', 'completed');
    } else if (eventType === 'appointment_reminder') {
      // Get appointments for today that are confirmed and haven't been reminded
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Get appointments in the next 30 minutes
      query = query
        .in('status', ['confirmed', 'inqueue'])
        .gte('time', currentTime);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format response for n8n
    const formattedAppointments = (appointments || []).map((apt: any) => {
      const serviceName = apt.services?.name || '';
      const barberName = apt.barbers?.name || '';
      const formattedDate = new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR');

      // Replace variables in template
      let message = template;
      message = message.replace(/\{\{nome_cliente\}\}/g, apt.client_name);
      message = message.replace(/\{\{nome_barbearia\}\}/g, shopName);
      message = message.replace(/\{\{serviço\}\}/g, serviceName);
      message = message.replace(/\{\{data\}\}/g, formattedDate);
      message = message.replace(/\{\{hora\}\}/g, apt.time);

      return {
        id: apt.id,
        protocol: apt.protocol,
        client: {
          name: apt.client_name,
          phone: apt.client_phone,
        },
        service: {
          name: serviceName,
          duration: apt.services?.duration,
          price: apt.services?.price,
        },
        barber: barberName,
        date: apt.date,
        date_formatted: formattedDate,
        time: apt.time,
        status: apt.status,
        created_at: apt.created_at,
        shop_name: shopName,
        message: message,
        event_type: eventType || 'all',
      };
    });

    // For reminder, filter appointments in next 30 minutes
    let finalAppointments = formattedAppointments;
    if (eventType === 'appointment_reminder') {
      const now = new Date();
      finalAppointments = formattedAppointments.filter((apt: any) => {
        const [hours, minutes] = apt.time.split(':').map(Number);
        const aptDate = new Date();
        aptDate.setHours(hours, minutes, 0, 0);
        
        const diffMinutes = (aptDate.getTime() - now.getTime()) / (1000 * 60);
        return diffMinutes > 0 && diffMinutes <= 30;
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: finalAppointments.length,
        date: date,
        event_type: eventType || 'all',
        shop_name: shopName,
        appointments: finalAppointments,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});