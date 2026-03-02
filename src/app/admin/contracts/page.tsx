import { getContracts } from '@/lib/contracts/actions';
import { ContractListClient } from './_components/ContractListClient';

export default async function ContractsPage() {
  const contracts = await getContracts();
  return <ContractListClient contracts={contracts} />;
}
