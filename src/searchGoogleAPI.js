import { config } from 'dotenv';
import { google } from 'googleapis';

config();

const apiKey = process.env.API_KEY;  
const cx = process.env.CX_ID;        

const customsearch = google.customsearch('v1');

/**
 * Searches Google using the custom search API for a given query string.
 * @param {string} queryString - The query string to search for.
 * @returns {Promise<object>} The search results from Google, or undefined if the search fails. The object has the following properties: title, snippet, displayLink, formattedUrl
 */
async function search(queryString) {
  let result;
  try {
      const res = await customsearch.cse.list({
          auth: apiKey,
          cx: cx,
          q: queryString,
          num: 10,
          lr: 'lang_en',
          safe: 'high',
          prettyPrint: true
      });
      result = res.data;
      //console.log("Search Results:", res.data);
  } catch (err) {
      console.error("Error executing search:", err);
  }
  return result;
}

/**
 * Extracts relevant information from the query output items.
 * @param {object} queryOutput - The query output containing items to extract information from.
 * @returns {object[]} An array of objects with properties: title, snippet, displayLink, formattedUrl.
 */
function extractRelevantInfo(queryOutput) {
  let output = [];
  const results = queryOutput.items;
  if(results && results.length > 0) {
    results.forEach(result => {
      const { title, snippet, displayLink, formattedUrl } = result;
      output.push({
        title,
        snippet,
        displayLink,
        formattedUrl
      })
    })
  }
  return output;
}

/**
 * Searches Google using the custom search API for a given query string and extracts relevant information from the search results.
 * @param {string} queryString - The query string to search for.
 * @returns {Promise<object[]>} An array of objects with properties: title, snippet, displayLink, formattedUrl. The array is empty if the search fails.
 */
export async function searchGoogleAPI(queryString) {
  const queryOutput = await search(queryString);
  if (queryOutput) return extractRelevantInfo(queryOutput);
}
