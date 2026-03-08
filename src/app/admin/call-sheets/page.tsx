import { getCallSheets } from '../actions';
import { CallSheetsManager } from './_components/CallSheetsManager';

export const dynamic = 'force-dynamic';

export default async function CallSheetsPage() {
  const callSheets = await getCallSheets();
  return <CallSheetsManager initialCallSheets={callSheets} />;
}
