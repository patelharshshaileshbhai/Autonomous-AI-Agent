import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API ListModels...');
console.log(`API Key present: ${!!apiKey}`);

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing');
    process.exit(1);
}

async function testListener() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        console.log(`Fetching models from: ${url.replace(apiKey!, 'HIDDEN_KEY')}`);

        const response = await axios.get(url);
        console.log('✅ Success! Available models:');

        if (response.data && response.data.models) {
            response.data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(', ')})`);
            });
        } else {
            console.log('No models found in response:', response.data);
        }

    } catch (error: any) {
        console.error('❌ Error listing models:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testListener();
