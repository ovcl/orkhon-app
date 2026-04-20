import { NextResponse } from 'next/server';
import { sitesData } from '../../data/sites';

// In-memory cache for AI descriptions
const aiCache = new Map();

/**
 * POST /api/ai-guide
 * Generate AI-powered explanations for heritage sites
 * 
 * Request body:
 *   - siteId: number (required)
 *   - question: string (optional) - specific question about the site
 *   - language: 'mn' | 'en' (optional, default: 'mn')
 */
export async function POST(request) {
    try {
        const { siteId, question, language = 'mn' } = await request.json();

        if (!siteId) {
            return NextResponse.json(
                { error: 'siteId is required' },
                { status: 400 }
            );
        }

        // Fetch site data from local static data
        const siteData = sitesData.find(s => s.id === parseInt(siteId));

        if (!siteData) {
            return NextResponse.json(
                { error: 'Site not found' },
                { status: 404 }
            );
        }

        const cacheKey = `${siteId}_${language}`;

        // Check if we have a cached AI description in memory
        if (!question && aiCache.has(cacheKey)) {
            return NextResponse.json({
                response: aiCache.get(cacheKey),
                cached: true,
            }, { status: 200 });
        }

        // Generate AI response using OpenAI
        const aiResponse = await generateAIResponse(siteData, question, language);

        // Cache the general description (not specific questions)
        if (!question) {
            aiCache.set(cacheKey, aiResponse);
        }

        return NextResponse.json({
            response: aiResponse,
            cached: false,
        }, { status: 200 });

    } catch (error) {
        console.error('Error generating AI response:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI response', message: error.message },
            { status: 500 }
        );
    }
}

async function generateAIResponse(siteData, question, language) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const siteName = language === 'en' && siteData.nameEn ? siteData.nameEn : siteData.name;
    const siteDescription = language === 'en' && siteData.descriptionEn ? siteData.descriptionEn : siteData.description;

    // Build the prompt
    let prompt;
    if (question) {
        prompt = `You are a knowledgeable virtual guide for the Orkhon Valley Cultural Landscape, a UNESCO World Heritage Site in Mongolia.

Site: ${siteName}
Category: ${siteData.category}
Description: ${siteDescription}

User question: ${question}

Please provide a helpful, informative answer in ${language === 'en' ? 'English' : 'Mongolian'}. Keep your response concise (2-3 paragraphs maximum).`;
    } else {
        prompt = `You are a knowledgeable virtual guide for the Orkhon Valley Cultural Landscape, a UNESCO World Heritage Site in Mongolia.

Please provide an engaging, informative explanation about this heritage site in ${language === 'en' ? 'English' : 'Mongolian'}:

Site: ${siteName}
Category: ${siteData.category}
Description: ${siteDescription}

Create a compelling narrative that highlights:
1. Historical significance
2. Cultural importance
3. Interesting facts that would engage visitors

Keep your response concise (2-3 paragraphs maximum) and suitable for a virtual tour guide.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert virtual tour guide for UNESCO World Heritage Sites, specializing in Mongolian history and culture.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}
