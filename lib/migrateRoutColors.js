import { getDb } from './mongoClient.js';

export async function migrateRouteColors() {
  const db = await getDb();
  const BUSES_COLL = 'buses';
  
  try {
    // Find all buses without routeColor
    const busesWithoutColor = await db.collection(BUSES_COLL).find({ routeColor: { $exists: false } }).toArray();
    
    console.log(`[migrateRouteColors] Found ${busesWithoutColor.length} buses without routeColor`);
    
    if (busesWithoutColor.length > 0) {
      // Update all of them to have the default color
      const result = await db.collection(BUSES_COLL).updateMany(
        { routeColor: { $exists: false } },
        { $set: { routeColor: '#3B82F6' } }
      );
      
      console.log(`[migrateRouteColors] Updated ${result.modifiedCount} buses with default color`);
    }
  } catch (error) {
    console.error('[migrateRouteColors] Error:', error);
  }
}
