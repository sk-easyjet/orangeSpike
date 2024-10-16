
import { fileURLToPath } from "url";

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

/**
 * Invokes an Anthropic model with a given prompt and returns the response.
 * @param {string} prompt - The text to be sent to the model.
 * @param {string} [modelId=anthropic.claude-3-haiku-20240307-v1:0] - The ID of the model to be invoked. Defaults to "anthropic.claude-3-haiku-20240307-v1:0".
 * @returns {Promise<string>} The response from the model.
 */
async function invokeModel(prompt, modelId = "anthropic.claude-3-haiku-20240307-v1:0"){
  const client = new BedrockRuntimeClient({ region: "eu-west-1" });


  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
  };

  const command = new InvokeModelCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId,
  });
  const apiResponse = await client.send(command);

  const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
  const responseBody = JSON.parse(decodedResponseBody);
  return responseBody.content[0].text;
};


/**
 * Takes a search engine query and the snippets of pages retrieved by the search engine, filters out irrelevant snippets based on guidelines, and returns the indices of relevant snippets.
 * @param {string} query - The search engine query.
 * @param {string} pageContents - The snippets of pages retrieved by the search engine. This is a single string that consists of multiple strings joined by new lines.
 * @returns {Promise<number[]>} The indices of the relevant snippets as an array of integers.
 */
export async function invokeWithPrompt(query, pageContents) {
  const numberedPageContents = pageContents.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
  let result = null;

    const prompt = `Here a search engine query:
                    <query>
                    ${query}
                    </query>
                    Here are the snippets of the pages retrieved by the search engine:
                    <pageSnippets>
                    ${numberedPageContents}
                    </pageSnippets>
        
                    Return the indices of the snippets that seem relevant to the query. Minimal relevance is also acceptable, as long as there is no profanity/harmful/explicit content.
                    <guidelines>
                    1. If the snippet seems to contain opinions, do not include that index.
                    2. If the snippet seems to be completely irrelevant, do not include that index, for example if a query is asking about flight delays and the snippet is an advertise for shoes, do not include that index.
                       The reason for this is that the two are completely unrelated, as someone asking for flight delay could not be interested in buying shoes. Apply this example to other queries appropriately.
                    3. If the snippet seems to contain even a small bit of relevance, then do include that index.
                    4. If the snippet contains profanity/harmful/explicit content, do not include that index.
                    5. Provide your reasoning in the <reasoning></reasoning> tag.
                    </guidelines>
  
                    
                    Return the indices of the relevant snippets inside <snippets></snippets> tags, separated by commas. Remember, only the indices`;
    const modelId = "anthropic.claude-3-haiku-20240307-v1:0";
  
    try {
      console.log("-".repeat(53));
      const response = await invokeModel(prompt, modelId);
      result = response.match(/<snippets>(.*?)<\/snippets>/s)[1].split(',').map(item => parseInt(item.trim()));
      console.log("\n" + "-".repeat(53));
      console.log("Final structured response:");
      console.log(response);
    } catch (err) {
      console.log(`\n${err}`);
    }
  console.log("Relevant indices returned by Bedrock: ", result)
  return result;

}


// const query = "How to improve website SEO?";
// const pageContents = `Learn how to boost your website's SEO with these tips and tricks for better search engine rankings.
// This article covers SEO strategies specifically tailored for e-commerce websites, focusing on product pages and category pages.
// Discover how to build backlinks to improve your website's search visibility.
// Boost your SEO with these on-page and off-page SEO techniques, including keyword research and link building.
// Latest trends in fashion! Check out our new collection of summer dresses.`;

// // Call the function
// invokeWithPrompt(query, pageContents);
