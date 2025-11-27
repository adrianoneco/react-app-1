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
  let cleanPath = path
    .replace(/^\/api\//, "")
    .replace(/\/[a-f0-9-]{36}/g, "")
    .replace(/\/\d+/g, "")
    .replace(/\/$/, "")
    .replace(/\//g, ".");
  
  const methodMap: Record<string, string> = {
    "GET": "",
    "POST": "",
    "PUT": ".update",
    "PATCH": ".update",
    "DELETE": ".delete",
  };

  const suffix = methodMap[method] || "";
  
  if (method === "POST" && !cleanPath.includes("login") && !cleanPath.includes("register") && !cleanPath.includes("logout")) {
    return `${cleanPath}.create`;
  }
  
  return `${cleanPath}${suffix}`;
}

export function webhookDispatcher(req: Request, res: Response, next: NextFunction) {
  const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  
  if (!allowedMethods.includes(req.method)) {
    return next();
  }

  if (!req.path.startsWith("/api/") || req.path.includes("/socket.io")) {
    return next();
  }

  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    const event = getEventName(req.method, req.path);
    
    const payload: WebhookPayload = {
      event,
      ...req.body,
      ...req.query,
      ...req.params,
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
