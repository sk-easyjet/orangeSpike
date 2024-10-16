import * as cheerio from 'cheerio';

import { waitForCheerioSelector, gotoWithRetry } from "./utils.js";
import axios from "axios";
import robotsParser from 'robots-parser';
import { resourcesettings } from 'googleapis/build/src/apis/resourcesettings/index.js';


/**
 * Scrapes the content of a given URL and returns a page object with the content, retrieves content of several selectors.
 * @param {string} url - The URL of the page to scrape.
 * @param {object} pageObject - The page object to store the scraped content in. The input pageObject has the following properties: title, snippet, displayLink and formattedUrl
 * @param {string} pageTitle - The title of the page to scrape.
 * @returns {Promise<object>} The page object with the scraped content. The pageObject has the following properties: title, snippet, displayLink, formattedUrl and contents
 * @throws {Error} If the scraping fails.
 */
export async function scrapePage(url, pageObject, pageTitle) { //will have a bunch of scrape page function calls running asynchronously

  const mainContentSelectors = ["p", "h1", "h2", "h3", "ul li", "ol li", "a[href]", "div", "span", "img[src]", "table", "tr", "td", "meta[name='description']", "meta[name='keywords']"];
    const mainTextContent = [];
    let result = null;

    const scrapingAllowed = await checkRobotsTxt(url);
    if (!scrapingAllowed) {
      return result;
    }

    try {
      const response = await gotoWithRetry(url);

      const pageContent = response.data;

      const $ = cheerio.load(pageContent);

      for (let i = 0; i < mainContentSelectors.length; i++) {
        const sel = mainContentSelectors[i];
        if ($(sel).length > 0) {
          $("script").remove();
          $("style").remove();
  
          let elementText = $(sel).text();
          elementText = elementText.replace(/\s{2,}/g, " ");
          mainTextContent.push(elementText);
        }
      }


      if (mainTextContent.length === 0) {
        console.log("No content in this page, check that URL and selectors are valid:", pageTitle, url);
      }

      pageObject.contents = mainTextContent;
      result = pageObject;

    } catch (error) {
      console.log("Could not scrape page and/or save the output of scraping, check the URL and try again");
      console.log(error)
    }

    
    return result;
}

/**
 * Checks the robots.txt file for the given URL to see if scraping is allowed.
 * If no robots.txt file exists or is not accessible, it will return true.
 * @param {string} url The URL to check the robots.txt file for
 * @return {Promise<boolean>} true if scraping is allowed, false otherwise
 */
async function checkRobotsTxt(url) {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const robotsResponse = await axios.get(robotsUrl);
    const robotsTxt = robotsResponse.data;
  
    //parse robots.txt
    const robots = robotsParser(robotsUrl, robotsTxt); 
  
    const isAllowed = robots.isAllowed(url, 'test-scraper'); 
    
    if (!isAllowed) {
      console.log(`Scraping is disallowed for ${url} by robots.txt`);
      return false;
    }
    
  } catch {
    console.log('Error checking robots.txt, does not exist or is not accessible:', url);
  }
  return true;

}