import { getContractTemplates } from '@/lib/contracts/actions';
import { TemplateListClient } from './_components/TemplateListClient';

export default async function ContractTemplatesPage() {
  const templates = await getContractTemplates();
  return <TemplateListClient templates={templates} />;
}
