import type { Response } from "express";

export default function hello(res: Response) {
    res.send("Hello from express!");
}
