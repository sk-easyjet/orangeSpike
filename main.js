import { scrapePage } from "./src/scrapePage.js";
import { searchGoogleAPI } from "./src/searchGoogleAPI.js";
import { moderateText } from "./src/queryModerationAPI.js";
import { invokeWithPrompt } from "./src/queryBedrock.js";
import { StringWrapper } from "@smithy/smithy-client";
import { measureApiResponseTime } from "./src/compareResponseTimes.js";

const pageDict = {};


async function main(queryString) {

    const apiResponseTimes = [];

    let queryOutput = await searchGoogleAPI(queryString); //returns a list of objects


    //scrapes all the pages asynchronously and stores in a dictionary with the url as the key
    const scrapePromises = queryOutput.map(async (output) => {
        const pageTitle = output.title;
        const scrapedOutput = await scrapePage(output.formattedUrl, output, pageTitle);
        if (scrapedOutput) {
            pageDict[output.formattedUrl] = scrapedOutput;
        } 
    });
    await Promise.all(scrapePromises);


    //runs the moderation function asynchronously
    let startTime = performance.now();
    const moderationPromises = Object.keys(pageDict).map(async (url) => {
        const joinedText = pageDict[url].contents.join('-----');
        
        
        const moderationResult = await moderateText(joinedText);                                    
        //const [moderationResult, time1] = await measureApiResponseTime(moderateText, joinedText);     //function call with time analysis


        if (moderationResult === false) {
            console.log('Removing ' + url + ' from results, due to moderation failure');
            delete pageDict[url];
            return url;
        }
    });


    //removes results that are flagged as sensitive by the results of the moderation function
    const removedUrls = (await Promise.all(moderationPromises)).filter(item => item !== undefined);
    let endTime = performance.now();
    apiResponseTimes.push(endTime - startTime);
    //filters out the removed URLs from queryOutput
    if (removedUrls.length > 0) {
        queryOutput = queryOutput.filter((output) => !removedUrls.includes(output.formattedUrl));
    }


    //run bedrock on the results to return an array of indices corresponding to the relevant snippets
    const snippetsList = Object.values(pageDict).map((output) => output.snippet).join('\n');

    startTime = performance.now();
    const snippetIndicesToKeep = await invokeWithPrompt(queryString, snippetsList);    
    endTime = performance.now();
    //const [snippetIndicesToKeep, time2] = await measureApiResponseTime(invokeWithPrompt, queryString, snippetsList);    //function call with time analysis
    apiResponseTimes.push(endTime - startTime);


    const filteredQueryOutput = queryOutput.filter((output, index) => snippetIndicesToKeep.includes(index));
    const filteredDictionary = Object.fromEntries(filteredQueryOutput.map((output) => [output.formattedUrl, output]));
    console.log(filteredDictionary);  //result of the scraping and filtering
    console.log(Object.keys(filteredDictionary).length);

    console.log("The response times for the Moderation and Bedrock API calls were: " + apiResponseTimes.map(time => time.toFixed(2)) + " ms");
    return filteredDictionary


}

main("weather");

//