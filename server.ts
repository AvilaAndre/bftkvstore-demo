import { BFTKVStore, CRDT_TYPE } from "./bftkvstore/main.ts";
import * as path from "https://deno.land/std@0.146.0/path/mod.ts";

// The directory of this module
const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));

// The public directory (with "index.html" in it)
const publicDir = path.join(moduleDir, "web");

const hasJson = (req: Request): boolean => {
  return (req.headers.get("content-type") == "application/json");
};

const kvstore: BFTKVStore = new BFTKVStore("127.0.0.1", 8089);

Deno.serve({ port: 8001 }, async (req) => {
  const url = new URL(req.url);

  if (req.method == "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (req.method != "POST" && req.method == "GET") {
    switch (url.pathname) {
      case "/":
        return new Response(
          await Deno.readFile(
            path.join(publicDir, "index.html"),
          ),
        );
      case "/index.js":
        return new Response(
          await Deno.readFile(
            path.join(publicDir, "index.js"),
          ),
        );
      case "/styles.css":
        return new Response(
          await Deno.readFile(
            path.join(publicDir, "styles.css"),
          ),
        );
    }
  }

  switch (url.pathname) {
    case "/":
      return await handleServerChange(req);
    case "/new":
      return await handleNew(req);
    case "/get":
      return await handleGet(req);
    case "/inc":
      return await handleInc(req);
    case "/dec":
      return await handleDec(req);
    case "/add":
      return await handleAdd(req);
    case "/rmv":
      return await handleRmv(req);
  }

  return new Response("Not Found", { status: 404 });
});

const handleServerChange = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: { hostname: string; port: number } = await req.json();

    if (
      json.hostname != undefined &&
      typeof (json.hostname) == "string" &&
      json.port != undefined &&
      typeof (json.port) == "number"
    ) {
      const result: boolean = await kvstore
        .changeServer(
          json.hostname,
          json.port,
        );

      if (result) {
        return new Response("Server changed successfully");
      } else {
        return new Response("Failed to change server", { status: 400 });
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const changeServer = async (json: { hostname: string; port: number }) => {
  if (
    json.hostname != undefined &&
    typeof (json.hostname) == "string" &&
    json.port != undefined &&
    typeof (json.port) == "number"
  ) {
    await kvstore
      .changeServer(
        json.hostname,
        json.port,
      );
  }
};

const handleNew = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: { hostname: string; port: number; type: CRDT_TYPE } = await req
      .json();

    await changeServer(json);
    if (
      json.type != undefined &&
      typeof (json.type) == "string" &&
      Object.values(CRDT_TYPE).some((v) => v === json.type)
    ) {
      const result: { res: object | null; ok: boolean } = await kvstore
        .newCrdt(
          json.type,
        );

      if (result.ok) {
        return new Response(JSON.stringify(result.res), {
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        });
      } else {
        return new Response(`Failed to create new ${json.type}`, {
          status: 400,
        });
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const handleGet = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: {
      hostname: string;
      port: number;
      key: string;
    } = await req.json();

    await changeServer(json);

    if (
      json.key != undefined &&
      typeof (json.key) == "string"
    ) {
      const result: { res: object | null; ok: boolean } = await kvstore
        .getCrdt(
          json.key,
        );

      if (result.ok) {
        return new Response(JSON.stringify(result.res), {
          headers: {
            "content-type": "application/json; charset=utf-8",
          },
        });
      } else {
        return new Response(`Failed to get crdt with key: ${json.key}`, {
          status: 400,
        });
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const handleInc = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: {
      hostname: string;
      port: number;
      key: string;
      value: number;
    } = await req.json();

    await changeServer(json);

    if (
      json.key != undefined &&
      typeof (json.key) == "string" &&
      json.value != undefined &&
      typeof (json.value) == "number"
    ) {
      const opSuccess: boolean = await kvstore
        .incCrdt(
          json.key,
          json.value,
        );

      if (opSuccess) {
        return new Response(
          `Successfully incremented crdt with key: ${json.key}`,
        );
      } else {
        return new Response(`Failed to increment crdt with key: ${json.key}`, {
          status: 400,
        });
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const handleDec = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: {
      hostname: string;
      port: number;
      key: string;
      value: number;
    } = await req.json();

    await changeServer(json);

    if (
      json.key != undefined &&
      typeof (json.key) == "string" &&
      json.value != undefined &&
      typeof (json.value) == "number"
    ) {
      const opSuccess: boolean = await kvstore
        .decCrdt(
          json.key,
          json.value,
        );

      if (opSuccess) {
        return new Response(
          `Successfully decremented crdt with key: ${json.key}`,
        );
      } else {
        return new Response(`Failed to decrement crdt with key: ${json.key}`, {
          status: 400,
        });
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const handleAdd = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: {
      hostname: string;
      port: number;
      key: string;
      value: number | string;
    } = await req.json();

    await changeServer(json);

    if (
      json.key != undefined &&
      typeof (json.key) == "string" &&
      json.value != undefined &&
      (typeof (json.value) == "number" || typeof (json.value) == "string")
    ) {
      const opSuccess: boolean = await kvstore
        .addCrdt(
          json.key,
          json.value,
        );

      if (opSuccess) {
        return new Response(
          `Successfully added ${json.value} to the crdt with key: ${json.key}`,
        );
      } else {
        return new Response(
          `Failed to add ${json.value} to the crdt with key: ${json.key}`,
          {
            status: 400,
          },
        );
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};

const handleRmv = async (req: Request): Promise<Response> => {
  if (hasJson(req)) {
    const json: {
      hostname: string;
      port: number;
      key: string;
      value: number | string;
    } = await req.json();

    await changeServer(json);

    if (
      json.key != undefined &&
      typeof (json.key) == "string" &&
      json.value != undefined &&
      (typeof (json.value) == "number" || typeof (json.value) == "string")
    ) {
      const opSuccess: boolean = await kvstore
        .rmvCrdt(
          json.key,
          json.value,
        );

      if (opSuccess) {
        return new Response(
          `Successfully removed ${json.value} from the crdt with key: ${json.key}`,
        );
      } else {
        return new Response(
          `Failed to remove ${json.value} from the crdt with key: ${json.key}`,
          {
            status: 400,
          },
        );
      }
    }
  }
  return new Response("Bad Request", { status: 400 });
};
