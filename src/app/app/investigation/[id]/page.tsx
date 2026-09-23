import { notFound } from "next/navigation";
import { investigationService } from "../../../../services/investigation.service";
import { InvestigationView } from "../../../../components/app/InvestigationView";
import { LocalInvestigation } from "../../../../components/app/LocalInvestigation";

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await investigationService.get(id);
  if (!scenario && id.startsWith("LOC-")) return <LocalInvestigation id={id} />;
  if (!scenario) notFound();
  return <InvestigationView scenario={scenario} />;
}
