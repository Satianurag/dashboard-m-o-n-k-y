export function hashPubkey(pubkey: string): number {
    return pubkey.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
}

export function generateDeterministicIP(pubkey: string): string {
    const hash = hashPubkey(pubkey);
    return `${(hash % 200) + 50}.${(hash * 7) % 256}.${(hash * 13) % 256}.${(hash * 19) % 256}`;
}

export function getTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 30) return 'fair';
    return 'poor';
}

export const NODE_LOCATIONS = [
    { country: 'United States', countryCode: 'US', city: 'New York', lat: 40.7128, lng: -74.006 },
    { country: 'United States', countryCode: 'US', city: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { country: 'United States', countryCode: 'US', city: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { country: 'United States', countryCode: 'US', city: 'Miami', lat: 25.7617, lng: -80.1918 },
    { country: 'United States', countryCode: 'US', city: 'Dallas', lat: 32.7767, lng: -96.7970 },
    { country: 'United States', countryCode: 'US', city: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    { country: 'Germany', countryCode: 'DE', city: 'Berlin', lat: 52.52, lng: 13.405 },
    { country: 'Germany', countryCode: 'DE', city: 'Munich', lat: 48.1351, lng: 11.5820 },
    { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
    { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.5074, lng: -0.1278 },
    { country: 'France', countryCode: 'FR', city: 'Paris', lat: 48.8566, lng: 2.3522 },
    { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { country: 'Singapore', countryCode: 'SG', city: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { country: 'Australia', countryCode: 'AU', city: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { country: 'Canada', countryCode: 'CA', city: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { country: 'India', countryCode: 'IN', city: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { country: 'India', countryCode: 'IN', city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { country: 'South Korea', countryCode: 'KR', city: 'Seoul', lat: 37.5665, lng: 126.978 },
    { country: 'Switzerland', countryCode: 'CH', city: 'Zurich', lat: 47.3769, lng: 8.5417 },
    { country: 'Ireland', countryCode: 'IE', city: 'Dublin', lat: 53.3498, lng: -6.2603 },
    { country: 'Poland', countryCode: 'PL', city: 'Warsaw', lat: 52.2297, lng: 21.0122 },
    { country: 'Finland', countryCode: 'FI', city: 'Helsinki', lat: 60.1699, lng: 24.9384 },
    { country: 'Sweden', countryCode: 'SE', city: 'Stockholm', lat: 59.3293, lng: 18.0686 },
    { country: 'Spain', countryCode: 'ES', city: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { country: 'Italy', countryCode: 'IT', city: 'Milan', lat: 45.4642, lng: 9.1900 },
    { country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { country: 'UAE', countryCode: 'AE', city: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { country: 'South Africa', countryCode: 'ZA', city: 'Cape Town', lat: -33.9249, lng: 18.4241 },
];

export const DATACENTERS = [
    'AWS US-East', 'AWS US-West', 'AWS EU-West', 'AWS AP-Tokyo',
    'GCP US-Central', 'GCP EU-West', 'GCP Asia-East',
    'Hetzner FSN', 'Hetzner HEL', 'OVH FR', 'OVH DE',
    'Contabo DE', 'Contabo US', 'DigitalOcean NYC', 'DigitalOcean AMS',
    'Vultr', 'Linode', 'Azure EU', 'Azure US'
];

export const ASNS = [
    { asn: 'AS24940', provider: 'Hetzner' },
    { asn: 'AS51167', provider: 'Contabo' },
    { asn: 'AS16509', provider: 'Amazon' },
    { asn: 'AS15169', provider: 'Google' },
    { asn: 'AS8075', provider: 'Microsoft' },
    { asn: 'AS16276', provider: 'OVH' },
    { asn: 'AS14061', provider: 'DigitalOcean' },
    { asn: 'AS20473', provider: 'Vultr' },
];

export function getNodeLocation(pubkey: string, index: number) {
    const hash = hashPubkey(pubkey);
    const location = NODE_LOCATIONS[(hash + index) % NODE_LOCATIONS.length];
    const datacenter = DATACENTERS[(hash * 7 + index) % DATACENTERS.length];
    const asnData = ASNS[(hash * 13 + index) % ASNS.length];

    return {
        ...location,
        datacenter,
        asn: asnData.asn,
    };
}
