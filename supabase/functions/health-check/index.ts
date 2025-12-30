import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * PACK ENTERPRISE: Health Check Endpoint
 * Monitora saúde do sistema para observabilidade
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheck {
  database: boolean;
  auth: boolean;
  storage: boolean;
  latency: {
    database: number;
    auth: number;
  };
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  uptime: number;
  checks: HealthCheck;
  metrics: {
    activeConnections?: number;
    totalRequests?: number;
  };
}

const startTime = Date.now();

serve(async (req) => {
  console.log("=== HEALTH CHECK STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: "Missing configuration",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checks: HealthCheck = {
    database: false,
    auth: false,
    storage: false,
    latency: {
      database: 0,
      auth: 0,
    },
  };

  // Check Database
  try {
    const dbStart = Date.now();
    const { error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1);
    
    checks.latency.database = Date.now() - dbStart;
    checks.database = !error;
    
    if (error) {
      console.error("Database check failed:", error.message);
    }
  } catch (error) {
    console.error("Database check exception:", error);
    checks.database = false;
  }

  // Check Auth
  try {
    const authStart = Date.now();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    checks.latency.auth = Date.now() - authStart;
    checks.auth = !error;
    
    if (error) {
      console.error("Auth check failed:", error.message);
    }
  } catch (error) {
    console.error("Auth check exception:", error);
    checks.auth = false;
  }

  // Check Storage
  try {
    const { error } = await supabase.storage.listBuckets();
    checks.storage = !error;
    
    if (error) {
      console.error("Storage check failed:", error.message);
    }
  } catch (error) {
    console.error("Storage check exception:", error);
    checks.storage = false;
  }

  // Determine overall status
  const allChecks = [checks.database, checks.auth, checks.storage];
  const healthyCount = allChecks.filter(Boolean).length;
  
  let status: HealthResponse["status"];
  if (healthyCount === allChecks.length) {
    status = "healthy";
  } else if (healthyCount >= 2) {
    status = "degraded";
  } else {
    status = "unhealthy";
  }

  const response: HealthResponse = {
    status,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
    metrics: {},
  };

  console.log("Health check result:", status);

  return new Response(JSON.stringify(response), {
    status: status === "unhealthy" ? 503 : 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
