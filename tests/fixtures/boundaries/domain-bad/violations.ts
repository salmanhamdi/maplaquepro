// Fixture volontairement non conforme (exclue de la compilation TypeScript).
import React from "react";
import { useRouter } from "next/navigation";
import fs from "fs";
import path from "node:path";
import { drizzle } from "drizzle-orm";
import { db } from "@/server/db";
import { outside } from "../outside";

export const unused = [React, useRouter, fs, path, drizzle, db, outside];
