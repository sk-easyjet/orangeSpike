import axios from 'axios';
import { config } from 'dotenv';

config();

/**
 * Calls the Google Cloud Natural Language API to moderate the content of a webpage based on guidelines.
 * @param {string} text - The content of the webpage to be moderated, raw content as scraped from the webpage.
 * @returns {Promise<boolean>} True if the moderation passed, false otherwise, returns false if any category has confidence > 0.7 or severity > 0.7
 * @see https://cloud.google.com/natural-language/docs/moderate-text-content
 */
export async function moderateText(text) {
    const apiKey = process.env.API_KEY; 
    const url = `https://language.googleapis.com/v2/documents:moderateText?key=${apiKey}`;

    const data = {
        modelVersion: "MODEL_VERSION_1",
        document: {
            content: text, 
            type: "PLAIN_TEXT",
            languageCode: "en"
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response:', response.data);
        
        //the following may be changed to allow more leniency, e.g. leniency on certain categories, scores.. etc.
        const categories = response.data.moderationCategories.filter(item => 
            item.confidence > 0.7 || item.severity > 0.7
        );


        if (categories.length > 0) {
            console.log('Content in this webpage may be flagged as:', categories);
            return false; 
        }

        return true; 
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return true; 
    }
}
