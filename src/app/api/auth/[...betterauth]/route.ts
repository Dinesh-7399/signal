// src/app/api/auth/[...betterauth]/route.ts
import { auth } from "@/lib/better-auth/auth";

export const GET = auth.handler;
export const POST = auth.handler;