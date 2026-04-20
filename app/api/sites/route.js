import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

/**
 * GET /api/sites
 * Fetch all heritage sites from Firestore
 * Query params:
 *   - category: filter by category (optional)
 *   - limit: number of results (optional, default: all)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const limit = searchParams.get('limit');

        let query = db.collection('sites').orderBy('id');

        if (category) {
            query = query.where('category', '==', category);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return NextResponse.json({ sites: [] }, { status: 200 });
        }

        const sites = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert GeoPoint to plain object for JSON serialization
            sites.push({
                ...data,
                location: {
                    lat: data.location.latitude,
                    lng: data.location.longitude,
                },
            });
        });

        return NextResponse.json({ sites }, { status: 200 });
    } catch (error) {
        console.error('Error fetching sites:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sites', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/sites/[id]
 * Fetch a single site by ID
 */
export async function GET_BY_ID(request, { params }) {
    try {
        const { id } = params;
        const doc = await db.collection('sites').doc(id).get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        const data = doc.data();
        const site = {
            ...data,
            location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
            },
        };

        return NextResponse.json({ site }, { status: 200 });
    } catch (error) {
        console.error('Error fetching site:', error);
        return NextResponse.json(
            { error: 'Failed to fetch site', message: error.message },
            { status: 500 }
        );
    }
}
