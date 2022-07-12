import {Application, Router} from "https://deno.land/x/oak/mod.ts";
import {updateSpotifyHistory} from "./spotify.ts";
import {updatePocketCastsHistory} from "./pocketCasts.ts";
import {createStatusResult} from './status.ts';

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = {
    hello: "world",
    size: parseInt(ctx.request.url.searchParams.get("size") || "10"),
    ignorePlayingStatus: ctx.request.url.searchParams.get('ignorePlayingStatus') === 'true',
  };
});

router.get("/update", async (ctx) => {
  ctx.response.body = await updateSpotifyHistory();
});

router.get("/updatepocketcasts", async (ctx) => {
  const size = parseInt(ctx.request.url.searchParams.get("size") || "10");
  const ignorePlayingStatus = ctx.request.url.searchParams.get('ignorePlayingStatus') === 'true';
  ctx.response.body = await updatePocketCastsHistory(size, ignorePlayingStatus);
});

router.get("/status", async (ctx) => {
  ctx.response.body = await createStatusResult();
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener(
  "listen",
  (e) => console.log("Listening on http://localhost:8000"),
);
await app.listen({ port: 8000 });
