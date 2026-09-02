#!/usr/bin/env bun

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect } from "effect";

import { program } from "#command.ts";

BunRuntime.runMain(program.pipe(Effect.provide(BunServices.layer)));
