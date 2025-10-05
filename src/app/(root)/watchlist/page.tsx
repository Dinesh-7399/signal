// src/app/(root)/watchlist/page.tsx
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { Trash, BellRing } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getWatchlistWithFinnhubData } from "@/lib/actions/watchlist.actions";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { getChangeColorClass } from "@/lib/utils";
import WatchlistButton from "@/components/WatchlistButton";
import SearchCommand from "@/components/SearchCommand";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export function WatchlistTable({
  watchlist,
  initialStocks,
}: {
  watchlist: StockWithData[];
  initialStocks: StockWithWatchlistStatus[];
}) {
  if (watchlist.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center max-w-md">
          <Trash className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold">Your Watchlist is Empty</h2>
          <p className="text-gray-500 mb-6">
            Start by searching for a stock and adding it to your watchlist to
            track its real-time performance.
          </p>
          <div className="flex justify-center">
            <SearchCommand
              renderAs="button"
              label="Search for Stocks"
              initialStocks={initialStocks}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-600">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <TableHead
                key={header}
                className="text-left text-white font-medium"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100">
          {watchlist.map((row) => (
            <TableRow key={row.symbol}>
              <TableCell className="text-left">
                <Link
                  href={`/stocks/${row.symbol}`}
                  className="hover:text-yellow-500"
                >
                  {row.company}
                </Link>
              </TableCell>
              <TableCell className="text-left font-mono">
                {row.symbol}
              </TableCell>
              <TableCell className="text-left">{row.priceFormatted}</TableCell>
              <TableCell
                className={`text-left ${getChangeColorClass(
                  row.changePercent
                )}`}
              >
                {row.changeFormatted}
              </TableCell>
              <TableCell className="text-left">{row.marketCap}</TableCell>
              <TableCell className="text-left">{row.peRatio}</TableCell>
              <TableCell className="text-left">
                <button className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-yellow-500">
                  <BellRing className="w-3 h-3" />
                  Add Alert
                </button>
              </TableCell>
              <TableCell className="text-left">
                <WatchlistButton
                  symbol={row.symbol}
                  company={row.company}
                  isInWatchlist={true}
                  type="icon"
                  showTrashIcon={true}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const WatchlistPage = async () => {
  const watchlist = await getWatchlistWithFinnhubData();
  const initialStocks = await searchStocks();

  return (
    <div className="watchlist-container">
      <div className="watchlist">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Your Watchlist</h1>
          <span className="text-gray-400">{watchlist.length} Stocks</span>
        </div>

        <WatchlistTable watchlist={watchlist} initialStocks={initialStocks} />

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-5">Watchlist News</h2>
          <p className="text-gray-500">
            News component will be implemented here using <code>getNews</code>{" "}
            for your tracked symbols.
          </p>
        </div>
      </div>

      <div className="watchlist-alerts flex flex-col gap-6 mt-8">
        <h2 className="text-xl font-semibold">Price Alerts</h2>
        <p className="text-gray-500">
          Alerts list component will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default WatchlistPage;
