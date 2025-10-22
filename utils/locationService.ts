// utils/locationService.ts

// Get Mapbox token from environment variables
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

export const locationService = {
  async searchLocations(query: string): Promise<any[]> {
    if (query.length < 2) return [];

    try {
      // Try Mapbox first if token is available
      if (MAPBOX_ACCESS_TOKEN) {
        return await this.searchWithMapbox(query);
      }
      // Fallback to OpenStreetMap (no API key needed)
      return await this.searchWithOpenStreetMap(query);
    } catch (error) {
      console.log('Location search failed, trying fallback...', error);
      
      // Fallback to sample data
      return this.getSampleLocations(query);
    }
  },

  async searchWithMapbox(query: string): Promise<any[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
        `access_token=${MAPBOX_ACCESS_TOKEN}&` +
        `country=ca,us&` +
        `limit=10&` +
        `types=place,locality,address`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Mapbox API error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.features.map((item: any) => ({
        id: item.id,
        description: item.place_name,
        address: {
          street: item.address || '',
          city: item.context?.find((c: any) => c.id.includes('place'))?.text || '',
          state: item.context?.find((c: any) => c.id.includes('region'))?.text || '',
          country: item.context?.find((c: any) => c.id.includes('country'))?.text || '',
          postalCode: item.context?.find((c: any) => c.id.includes('postcode'))?.text || '',
        },
        coordinates: item.geometry.coordinates
      }));
    } catch (error) {
      console.error('Mapbox search error:', error);
      throw error;
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
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'SafeSpace-App/1.0'
        }
      }
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
  },
  async searchAddresses(query: string): Promise<any[]> {
    try {
      // Use Mapbox for address search if token available
      if (MAPBOX_ACCESS_TOKEN) {
        const encodedQuery = encodeURIComponent(query + ', Canada');
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
          `access_token=${MAPBOX_ACCESS_TOKEN}&` +
          `country=ca&` +
          `limit=5&` +
          `types=address`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        return data.features.map((item: any) => ({
          id: item.id,
          description: item.place_name,
          address: item.properties?.address || item.address || ''
        }));
      }

      // Fallback to OpenStreetMap
      const params = new URLSearchParams({
        q: query + ', Canada',
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'ca',
        'accept-language': 'en',
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'SafeSpace-App/1.0'
          }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.place_id,
        description: item.display_name,
        address: item.address
      }));
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  },

  async searchPostalCodes(query: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        postalcode: query,
        country: 'Canada',
        format: 'json',
        limit: '5'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.place_id,
        description: `${item.display_name} (${item.address?.postcode})`,
        postalCode: item.address?.postcode
      }));
    } catch (error) {
      console.error('Error searching postal codes:', error);
      return [];
    }
  }
}

