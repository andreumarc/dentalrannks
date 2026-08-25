/**
 * Envoltorio fino para ejecutar el seed de datos de demostración desde la CLI
 * (`npm run db:seed`, invocado por Prisma también tras `prisma migrate dev`).
 *
 * Toda la lógica vive en `src/server/seed.ts` (`runSeed`); este archivo solo
 * la invoca y cierra la conexión de Prisma al terminar.
 *
 * Uso:
 *   npx tsx prisma/seed.ts            # siembra sin duplicar si ya existe
 *   npx tsx prisma/seed.ts --reset    # borra los datos de demo y resiembra
 */
import { runSeed } from "@/server/seed";
import { prisma } from "@/lib/prisma";

async function main() {
  const reset = process.argv.includes("--reset");
  const summary = await runSeed({ reset });

  if (summary.alreadySeeded) {
    console.log("El seed ya se había ejecutado antes; no se ha duplicado nada.");
    console.log("Vuelve a ejecutar con --reset si quieres regenerar los datos de demo.");
  } else {
    console.log("Seed de datos de demostración completado.");
  }
  console.log(summary);
}

main()
  .catch((error) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
