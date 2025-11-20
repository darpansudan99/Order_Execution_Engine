export interface Quote {
  price: number;
  fee: number;
}

export interface Dex {
  name: string;
  getQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote>;
  executeSwap(order: any): Promise<{ txHash: string; executedPrice: number }>;
}
