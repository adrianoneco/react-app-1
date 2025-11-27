import type { Request, Response, NextFunction } from "express";

export interface WebhookPayload {
  event: string;
  [key: string]: any;
}

async function dispatchWebhook(payload: WebhookPayload): Promise<void> {
  const webhookUrl = process.env.GLOBAL_WEBHOOK_URL;
  const apiKey = process.env.GLOBAL_API_KEY;

  if (!webhookUrl) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["X-API-Key"] = apiKey;
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}

function getEventName(method: string, path: string): string {
  // Extract and clean path: /api/auth/login -> auth.login
  let event = path
    .replace(/^\/api\//, "")
    .replace(/\/[a-f0-9-]{36}$/g, "")
    .replace(/\/\d+$/g, "")
    .replace(/\/$/, "")
    .replace(/\//g, ".");

  return event;
}

function parseGeolocation(req: Request): object | null {
  if (req.body?.geolocation) {
    return req.body.geolocation;
  }
  
  if (req.query._geo) {
    try {
      return JSON.parse(req.query._geo as string);
    } catch {
      return null;
    }
  }
  
  return null;
}

function cleanQueryParams(query: Record<string, any>): Record<string, any> {
  const { _geo, ...rest } = query;
  return rest;
}

export function webhookDispatcher(req: Request, res: Response, next: NextFunction) {
  const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  
  if (!allowedMethods.includes(req.method)) {
    return next();
  }

  const fullPath = req.originalUrl.split('?')[0];
  if (!fullPath.startsWith("/api/") || fullPath.includes("/socket.io")) {
    return next();
  }

  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    const event = getEventName(req.method, req.originalUrl.split('?')[0]);
    const geolocation = parseGeolocation(req);
    const cleanQuery = cleanQueryParams(req.query as Record<string, any>);
    
    const { geolocation: _, ...bodyWithoutGeo } = req.body || {};
    
    const payload: WebhookPayload = {
      event,
      ...bodyWithoutGeo,
      ...cleanQuery,
      ...req.params,
      geolocation,
      userId: req.session?.userId || null,
      timestamp: new Date().toISOString(),
    };

    dispatchWebhook(payload).catch(err => {
      console.error("Failed to dispatch webhook:", err);
    });

    return originalJson(data);
  };

  next();
}
