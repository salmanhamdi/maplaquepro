// C6 — image via next/image (optimisation), et même image avec unoptimized (repli).
import Image from "next/image";
import { connection } from "next/server";

export default async function ImagePage() {
  await connection();
  return (
    <main>
      <Image id="optimized" src="/probe.png" alt="optimisée" width={320} height={240} />
      <Image id="unoptimized" src="/probe.png" alt="non optimisée" width={320} height={240} unoptimized />
    </main>
  );
}
