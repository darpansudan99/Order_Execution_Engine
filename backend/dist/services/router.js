import { RaydiumDex } from './dex/raydium.js';
import { MeteoraDex } from './dex/meteora.js';
class DexRouter {
    constructor() {
        this.dexes = [new RaydiumDex(), new MeteoraDex()];
    }
    async findBestRoute(tokenIn, tokenOut, amount) {
        const rawQuotes = await Promise.all(this.dexes.map(async (dex) => {
            try {
                const quote = await dex.getQuote(tokenIn, tokenOut, amount);
                return quote ? { dex, quote } : null; // Return null if quote is invalid
            }
            catch (error) {
                console.warn(`Error getting quote from ${dex.name}: ${error instanceof Error ? error.message : String(error)}`);
                return null;
            }
        }));
        // Filter for valid quotes, ensuring quote and quote.price are present and numeric
        // Explicitly type the filter callback to help TypeScript infer non-null type
        const validQuotes = rawQuotes.filter((q) => q !== null && q.quote && typeof q.quote.price === 'number' && typeof q.quote.fee === 'number' && !isNaN(q.quote.price) && !isNaN(q.quote.fee));
        if (validQuotes.length === 0) {
            throw new Error(`No valid routes found for ${tokenIn}/${tokenOut} with amount ${amount}`);
        }
        // Provide the first valid quote as the initial value to ensure 'best' is never null
        const bestRoute = validQuotes.reduce((best, current) => {
            if (current.quote.price > best.quote.price) {
                return current;
            }
            return best;
        }, validQuotes[0]);
        console.log(`Best route found: ${bestRoute.dex.name} with price ${bestRoute.quote.price}`);
        return bestRoute;
    }
}
export const dexRouter = new DexRouter();
