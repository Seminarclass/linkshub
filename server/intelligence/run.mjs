// CLI entrypoint: run the hourly intelligence cycle once.
import { DiscoveryOrchestrator } from "./orchestrator.js";

const cycle = parseInt(process.argv.find(a => a.startsWith("--cycle="))?.split("=")[1] || "1", 10);
const noValidate = process.argv.includes("--no-validate");
const maxTopics = parseInt(process.argv.find(a => a.startsWith("--max-topics="))?.split("=")[1] || "20", 10);
const maxValidations = parseInt(process.argv.find(a => a.startsWith("--max-validations="))?.split("=")[1] || "10", 10);

const orch = new DiscoveryOrchestrator();

console.log(`\n🔍 LinksHub Hourly Domain Intelligence — cycle ${cycle}`);
console.log(`   validate=${!noValidate}  maxTopics=${maxTopics}  maxValidations=${maxValidations}\n`);

for (let i = 0; i < cycle; i++) {
  console.log(`\n--- Cycle ${i + 1}/${cycle} ---`);
  const r = await orch.runHourlyCycle({ validate: !noValidate, maxTopics, maxValidations });
  console.log(JSON.stringify({
    newDomains: r.newDomains,
    updatedSources: r.updatedSources,
    duplicatesMerged: r.duplicatesMerged,
    validationFailures: r.validationFailures,
    topicsAnalyzed: r.topicsAnalyzed.length,
    overallUpdateStatus: r.overallUpdateStatus,
    verificationStatus: r.verificationStatus,
    verify: r.verify,
  }, null, 2));
}

console.log("\n✅ Done.\n");
