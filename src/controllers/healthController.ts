import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Megagend API",
    timestamp: new Date().toISOString(),
  });
};
