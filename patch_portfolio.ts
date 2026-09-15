  async savePortfolioItem(item: any): Promise<void> {
    return DQFirebase.savePortfolioItem(item);
  },

  async deletePortfolioItem(itemId: string): Promise<void> {
    return DQFirebase.deletePortfolioItem(itemId);
  },

  async fetchPortfolio(): Promise<any[]> {
    return DQFirebase.fetchPortfolio();
  },

  async getPortfolio(): Promise<any[]> {
    return DQFirebase.fetchPortfolio();
  },

  subscribePortfolio(callback: (items: any[]) => void): () => void {
    const unsub = DQFirebase.subscribePortfolio(callback);
    return () => unsub();
  },
