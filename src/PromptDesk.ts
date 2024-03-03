import axios from 'axios';
import { memoize } from './utils';

export class PromptDesk {
  private apiKey: string;
  private serviceUrl: string;
  private cache: any = {};

  constructor(obj: { apiKey?: string; serviceUrl?: string }) {
    this.apiKey = obj.apiKey || process.env.PROMPTDESK_API_KEY || '';
    this.serviceUrl = obj.serviceUrl || process.env.PROMPTDESK_SERVICE_URL || '';

    //remove trailing slash
    this.serviceUrl = this.serviceUrl.replace(/\/$/, '');
  }

  async ping(): Promise<string | null> {
    try {
      const response = await axios.get(`${this.serviceUrl}/ping`);
      if (response.status === 200) {
        return response.data;
      } else {
        console.error(`Failed: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error(`Request failed: ${error}`);
      return null;
    }
  }

  convertToObject(string:any) {
    // Check if input is already an object or an array
    if (typeof string === 'object') {
        return string;
    }

    // Unescape HTML entities
    string = this.unescapeHtml(string);

    // Trim whitespace
    string = string.trim();

    const regex = /('(?=(,\s*')))|('(?=:))|((?<=([:,]\s*))')|((?<={)')|('(?=}))/g;
    string = string.replace(regex, '"');

    try {
        // Try parsing as JSON
        return JSON.parse(string);
    } catch (e) {
        // If JSON parsing fails, return null
        return null;
    }
  }

  unescapeHtml(string: string): string {
    const map: { [key: string]: string } = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&apos;': "'"
    };

    return string.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;/g, function(m: string) { return map[m]; });
  }


  async list(): Promise<any> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      };
      const response = await axios.get(`${this.serviceUrl}/api/prompts`, { headers });
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  cachedCall: any = memoize(async (payload: string, headers: any) => {
    return await axios.post(`${this.serviceUrl}/api/generate`, payload, { headers })
  })

  async generate(promptName: string, variables: any = {}, options?: {chain?: { uuid: string; name: string }, object?: boolean | false, cache?: boolean | false, classification?: any}): Promise<any> {
    if (!this.apiKey) {
      throw new Error("API_KEY is not set");
    }

    const chain = options?.chain;
    const object = options?.object;
    const cache = options?.cache;
    let classification = options?.classification;

    const payload = {
      prompt_name: promptName,
      variables: variables,
    } as any;

    if (chain) {
      payload['chain'] = {
        uuid: chain.uuid,
        name: chain.name,
      };
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    try {
      let response;

      if (cache) {
        payload['cache'] = true;
        response = await this.cachedCall(JSON.stringify(payload), headers);
      } else {
        response = await axios.post(`${this.serviceUrl}/api/generate`, payload, { headers });
      }
      
      const message = response.data.message;

      let generatedString;
      if (typeof message === 'string') {
        generatedString = message;
      } else if ('content' in message) {
        generatedString = message.content;
      } else {
        throw new Error("Failed to generate output - content or message not found in response.");
      }

      if (object) {
        return this.convertToObject(generatedString);
      }

      const defaultClassification = {
        true: ["yes", "true", "1"],
        false: ["no", "false", "0"],
      };

      if (classification) {
        if (classification === true) {
          classification = defaultClassification;
        }

        for (const key in classification) {
          for (const value of classification[key]) {
            if (generatedString.trim().toLowerCase().includes(value)) {
              //check if key is a boolean
              if (key.toLocaleLowerCase() === "true") {
                return true;
              } else if (key.toLocaleLowerCase() === "false") {
                return false;
              } else {
                return key;
              }
            }
          }
        }
        return null;
      }

      return generatedString;
    } catch (error:any) {
      throw new Error(`${error.response?.data?.error || error.message}`);
    }

  }

}