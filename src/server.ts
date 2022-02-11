import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { updateSpotifyHistory } from "./spotify.ts";
import { updatePocketCastsHistory } from "./pocketCasts.ts";

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = {
    hello: "world",
  };
});

router.get("/update", async (ctx) => {
  ctx.response.body = await updateSpotifyHistory();
});

router.get("/updatepocketcasts", async (ctx) => {
  ctx.response.body = await updatePocketCastsHistory();
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener(
  "listen",
  (e) => console.log("Listening on http://localhost:8000"),
);
await app.listen({ port: 8000 });
