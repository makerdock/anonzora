import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { Logestic } from "logestic";

export const createElysia = (
  config?: ConstructorParameters<typeof Elysia>[0]
) =>
  new Elysia(config)
    .use(cors())
    .use(
      jwt({
        name: "jwt",
        secret: "05H9hitTObfnPNDGPvDmPVyQCRBuizMVWlZ5lp0DVR",
      })
    )
    .use(Logestic.preset("common"))
    .derive(async ({ jwt, headers }) => {
      const auth = headers.authorization;
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token) {
        const payload = await jwt.verify(token);
        if (payload) {
          return { passkeyId: payload.passkeyId as string };
        }
      }
      return { passkeyId: null };
    })
    .onError(({ server, error, path }) => {
      console.error(path, error);
      if (error.message.toLowerCase().includes("out of memory")) {
        server?.stop();
        process.exit(1);
      }
    });
