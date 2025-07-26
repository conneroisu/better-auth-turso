import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/nextjs";

const handler = toNextJsHandler(auth);

export const GET = handler;
export const POST = handler;