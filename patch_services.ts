  async saveService(service: any): Promise<void> {
    return DQFirebase.saveService(service);
  },

  async deleteService(serviceId: string): Promise<void> {
    return DQFirebase.deleteService(serviceId);
  },

  async fetchServices(): Promise<any[]> {
    return DQFirebase.fetchServices();
  },

  async getServices(): Promise<any[]> {
    return DQFirebase.fetchServices();
  },

  subscribeServices(callback: (services: any[]) => void): () => void {
    const unsub = DQFirebase.subscribeServices(callback);
    return () => unsub();
  },
