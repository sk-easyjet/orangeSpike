import axios from "axios";


/**
 * Performs a GET request to the specified URL with up to 3 retries.
 * Will retry upon any error, and after 3 retries will return the last response.
 * The headers are set to simulate a browser request.
 * @param {string} url - The URL to request.
 * @returns {Promise<object>} The final response from the request.
 */
export async function gotoWithRetry(url) {
    let retries = 0;
    let success = false;
    let response = {};
    while (retries < 3 && !success) {
      try {
        response = await axios.get(url, { headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0", } });
        success = true;
      } catch (error) {
        retries++;
        console.log(`Error on retry ${retries}, ${3-retries} retries left, at url: ${url}`);
      }
    }
    if(success === false) {
      return response;
    }
    return response;
}

/**
 * Waits until the specified selector appears on the page and resolves.
 * @param {object} $ - The cheerio object.
 * @param {string} selector - The selector to wait for.
 * @returns {Promise<void>} A promise that resolves when the specified selector appears.
 */
export async function waitForCheerioSelector($, selector) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if ($(selector).length > 0) {
          clearInterval(interval);
          resolve();
        } else {
          resolve();
        }
      }, 1000);
    });
}