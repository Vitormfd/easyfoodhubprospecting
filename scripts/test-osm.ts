/**
 * Testa a busca de estabelecimentos via OpenStreetMap (Overpass API),
 * sem depender do Supabase.
 *
 * Rodar: npx tsx scripts/test-osm.ts
 */
import { osmSource } from "../src/lib/sources/osm";

async function main() {
  const city = process.argv[2] ?? "Senhor do Bonfim";
  const state = process.argv[3] ?? "BA";
  const results = await osmSource.search({
    city,
    state,
    segments: ["Restaurante", "Hamburgueria", "Pizzaria", "Açaí"],
    limit: 30,
  });

  console.log(`Encontrados: ${results.length}`);
  console.table(
    results.slice(0, 15).map((r) => ({
      nome: r.businessName,
      categoria: r.category,
      endereco: r.address,
      telefone: r.phone,
      site: r.website,
    })),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
