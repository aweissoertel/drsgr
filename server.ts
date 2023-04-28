import express from "express";
import ViteExpress from "vite-express";

import hello from "./server/hello";

const app = express();

app.get("/hello", (_, res) => hello(res));

ViteExpress.listen(app, 3000, () => console.log("Server is listening..."));
