// src/lib/actions/watchlist.actions.ts
'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/Watchlist.model';
import { getQuote, getProfile } from '@/lib/actions/finnhub.actions';
import { formatMarketCapValue, formatPrice, formatChangePercent } from '@/lib/utils';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';


export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

// --- NEW FUNCTION: Toggle Watchlist Status (Add or Remove) ---
export async function toggleWatchlist(symbol: string, company: string, isCurrentlyInWatchlist: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const userEmail = session?.user?.email;

        if (!userEmail) return { success: false, message: 'User not authenticated' };

        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Find user ID from email using the 'user' collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email: userEmail });
        const userId = (user?.id as string) || String(user?._id || '');
        
        if (!userId) return { success: false, message: 'User ID not found' };

        const query = { userId, symbol: symbol.toUpperCase() };

        if (isCurrentlyInWatchlist) {
            // Remove from watchlist
            await Watchlist.deleteOne(query);
            return { success: true, message: `Removed ${symbol.toUpperCase()} from watchlist` };
        } else {
            // Add to watchlist
            const newItem = new Watchlist({ userId, symbol: symbol.toUpperCase(), company });
            await newItem.save();
            return { success: true, message: `Added ${symbol.toUpperCase()} to watchlist` };
        }

    } catch (err) {
        console.error('toggleWatchlist error:', err);
        // Handle unique constraint error (E11000) gracefully
        if (err && (err as any).code === 11000) {
            return { success: false, message: 'Stock is already in your watchlist' };
        }
        return { success: false, message: 'Failed to toggle watchlist status' };
    }
}


// --- EXISTING FUNCTION: Fetch watchlist items and enhance with real-time Finnhub data ---
export async function getWatchlistWithFinnhubData(): Promise<StockWithData[]> {
    try {
        // 1. Get user session to identify the user
        const session = await auth.api.getSession({ headers: await headers() });
        const userEmail = session?.user?.email;

        if (!userEmail) return [];

        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // 2. Find user ID from email using the 'user' collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email: userEmail });
        const userId = (user?.id as string) || String(user?._id || '');
        
        if (!userId) return [];

        // 3. Fetch all watchlist items for the user
        const watchlistItems = await Watchlist.find({ userId }).lean();
        if (watchlistItems.length === 0) return [];

        // 4. Fetch real-time data for all symbols concurrently
        const enhancedWatchlist: StockWithData[] = await Promise.all(
            watchlistItems.map(async (item) => {
                const [quote, profile] = await Promise.all([
                    getQuote(item.symbol),
                    getProfile(item.symbol),
                ]);

                const currentPrice = quote?.c || 0;
                const changePercent = quote?.dp || 0;
                const marketCap = profile?.marketCapitalization;
                const peRatio = profile?.metric?.peRatio; 

                return {
                    userId: item.userId,
                    symbol: item.symbol,
                    company: item.company,
                    addedAt: item.addedAt,
                    currentPrice,
                    changePercent,
                    priceFormatted: formatPrice(currentPrice),
                    changeFormatted: formatChangePercent(changePercent),
                    marketCap: marketCap ? formatMarketCapValue(marketCap) : 'N/A',
                    peRatio: peRatio && peRatio > 0 ? peRatio.toFixed(2) : 'N/A',
                } as StockWithData;
            })
        );

        // 5. Filter out stocks where price could not be fetched (c=0)
        return enhancedWatchlist.filter(item => (item.currentPrice || 0) > 0);

    } catch (err) {
        console.error('getWatchlistWithFinnhubData error:', err);
        return [];
    }
}