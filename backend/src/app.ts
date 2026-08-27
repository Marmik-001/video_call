import express, { type Request, type Response } from "express";

import cors from "cors";

export const app = express();
app.use(cors());


app.get("/", (req: Request, res: Response) => {
  res.send({ msg: "web socket server is running" });
});






