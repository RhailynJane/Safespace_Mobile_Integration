// utils/locationService.ts
export const locationService = {
  async searchLocations(query: string): Promise<any[]> {
    if (query.length < 2) return [];

    try {
      // Try OpenStreetMap first (no API key needed)
      return await this.searchWithOpenStreetMap(query);
    } catch (error) {
      console.log('OpenStreetMap failed, trying fallback...', error);
      
      // Fallback to sample data
      return this.getSampleLocations(query);
    }
  },

  async searchWithOpenStreetMap(query: string): Promise<any[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '10',
      countrycodes: 'ca,us',
      'accept-language': 'en',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item.place_id,
      description: item.display_name,
      address: {
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postalCode: item.address?.postcode,
      }
    }));
  },

  getSampleLocations(query: string): any[] {
    const canadianCities = [
      "Calgary, AB, Canada", "Toronto, ON, Canada", "Vancouver, BC, Canada",
      "Montreal, QC, Canada", "Ottawa, ON, Canada", "Edmonton, AB, Canada",
      "Winnipeg, MB, Canada", "Quebec City, QC, Canada", "Hamilton, ON, Canada",
      "Halifax, NS, Canada", "Victoria, BC, Canada", "Saskatoon, SK, Canada"
    ];

    return canadianCities
      .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(city => ({
        id: city,
        description: city,
        address: { city }
      }));
  }
};