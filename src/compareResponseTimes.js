/**
 * Measures the response time of an API function by calculating the duration between the start and end of the API call.
 * @param {Function} apiFunction - The API function to measure the response time for.
 * @param {...any} args - The arguments to be passed to the API function.
 * @returns {Promise<any>} The result of the API function call.
 */
export async function measureApiResponseTime(apiFunction, ...args) {
    const startTime = performance.now();
    const result = await apiFunction(...args);
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`API Response Time for ${apiFunction.name}: ${duration.toFixed(2)} ms`);
    return [result, duration];
}