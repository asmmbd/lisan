import { mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

async function copyAssets() {
  try {
    const standalonePath = join(".next", "standalone");
    const standaloneNextPath = join(standalonePath, ".next");

    console.log("Copying .next/static to standalone build...");
    if (!existsSync(standaloneNextPath)) {
      await mkdir(standaloneNextPath, { recursive: true });
    }
    
    await cp(join(".next", "static"), join(standaloneNextPath, "static"), {
      recursive: true,
    });

    console.log("Copying public/ to standalone build...");
    await cp("public", join(standalonePath, "public"), {
      recursive: true,
    });

    console.log("Assets copied successfully!");
  } catch (error) {
    console.error("Error copying assets:", error);
    process.exit(1);
  }
}

copyAssets();
