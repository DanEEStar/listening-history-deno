/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.150.0/http/server.ts";
import { router } from "https://crux.land/router@0.0.12";
import { h, ssr } from "https://crux.land/nanossr@0.0.5";
import { createStatusResult } from "./status.ts";
import { updatePocketCastsHistory } from "./pocketCasts.ts";
import { searchSpotify, updateSpotifyHistory } from "../server/services/spotify.ts";

const createJsonResponse = (data: any) => {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
};

serve(
  router({
    "/": async (req, context) => {
      let tracks = [];
      const search = new URL(req.url).searchParams.get("search");
      if (search && search.length > 3) {
        console.log(search);
        tracks = (await searchSpotify(search)).rows;
        console.log(tracks);
      }
      return ssr(() => <Search search={search ?? ""} tracks={tracks} />);
    },
    "/status": async (_req, context) => {
      return createJsonResponse(await createStatusResult());
    },
    "/update": async (_req, context) => {
      return createJsonResponse(await updateSpotifyHistory());
    },
    "/updatepocketcasts": async (req, context) => {
      const url = new URL(req.url);
      const size = parseInt(url.searchParams.get("size") || "10");
      const ignorePlayingStatus =
        url.searchParams.get("ignorePlayingStatus") === "true";
      return createJsonResponse(
        await updatePocketCastsHistory(size, ignorePlayingStatus)
      );
    },
    "/bagels/:id": (_req, _context, matches) => {
      return ssr(() => <Bagel id={matches.id} />);
    },
    "/search": (req) => {
      const search = new URL(req.url).searchParams.get("search");
      return ssr(() => <Search search={search ?? ""} />);
    },
  })
);

function Search({ search, tracks }: { search: string; tracks: any[] }) {
  return (
    <form
      method="get"
      class="flex min-h-screen flex-col items-center justify-center gap-8 p-4"
    >
      <input
        type="text"
        name="search"
        value={search}
        class="h-10 w-96 rounded-md bg-gray-100 px-4 py-3 leading-4 placeholder:text-gray-400"
        placeholder="Search and press enter..."
      />
      <output name="result" for="search" class="w-10/12 lg:w-1/2">
        <ul class="space-y-2">
          {tracks.length > 0 &&
            tracks.map((track) => (
              <li class="rounded-md p-1.5 hover:bg-gray-100">
                <div class="font-semibold">{track[3]}</div>
                <div class="text-sm text-gray-500">{track[2]}</div>
              </li>
            ))}
          <li>{tracks.length === 0 && <div>No tracks found. Try again.</div>}</li>
        </ul>
      </output>
    </form>
  );
}
