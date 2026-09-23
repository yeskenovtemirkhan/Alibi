import { transactionsService } from "../../../services/transactions.service";
import { TransactionsView } from "../../../components/app/TransactionsView";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const rows = await transactionsService.list();
  const countries = transactionsService.countries();
  return <TransactionsView rows={rows} countries={countries} />;
}
