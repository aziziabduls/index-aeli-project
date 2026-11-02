import dotenv from 'dotenv';

dotenv.config();

const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:7011';

export class DestinationResolverService {
  async resolveDestination(destinationId: string | null): Promise<any | null> {
    if (!destinationId) return null;
    try {
      const res = await fetch(`${contentServiceUrl}/internal/destinations/${destinationId}`);
      if (!res.ok) return null;
      const body = (await res.json()) as any;
      return body.success ? body.data : null;
    } catch (err) {
      console.warn(`Failed to resolve destination ${destinationId} via content-service:`, err);
      return null;
    }
  }
}

export const destinationResolverService = new DestinationResolverService();

