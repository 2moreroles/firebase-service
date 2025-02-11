// retryHelper.ts
class RetryHelper {
  private retryLimit: number;
  private retryDelay: number;

  constructor(retryLimit: number = 3, retryDelay: number = 1000) {
    this.retryLimit = retryLimit;
    this.retryDelay = retryDelay;
  }

  // Delay function that returns a promise after waiting for a specified amount of time
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Retry function that tries an operation multiple times before failing
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (attempt < this.retryLimit) {
      try {
        return await fn();
      } catch (error) {
        attempt++;
        if (attempt >= this.retryLimit) {
          console.error('Max retry attempts reached. Operation failed.');
          throw error; // Rethrow error if retry attempts are exhausted
        }
        console.log(`Attempt ${attempt} failed. Retrying...`);
        await this.delay(this.retryDelay); // Wait before retrying
      }
    }
    throw new Error('Unexpected error occurred during retry');
  }
}

export default RetryHelper;
