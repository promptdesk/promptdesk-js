import axios from 'axios';

interface Chain {
  uuid: string;
  name: string;
}

interface Classification {
  [key: string]: string[];
}

export class PromptDesk {
  private apiKey: string;
  private serviceUrl: string;

  constructor(obj: { apiKey?: string; serviceUrl?: string }) {
    this.apiKey = obj.apiKey || process.env.PROMPTDESK_API_KEY || '';
    this.serviceUrl = obj.serviceUrl || process.env.PROMPTDESK_SERVICE_URL || 'https://app.promptdesk.ai';
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
      console.log(e)
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

  // Caching functionality in TypeScript would typically require a different approach
  // For example, using a dedicated caching library or custom implementation
  async cachedCall(payload: string, headers: string): Promise<any> {
    // Implement caching logic here
    const parsedPayload = JSON.parse(payload);
    parsedPayload['cache'] = true;
    const parsedHeaders = JSON.parse(headers);

    try {
      const response = await axios.post(`${this.serviceUrl}/api/generate`, parsedPayload, { headers: parsedHeaders });
      return response.data;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  async generate(prompt_name: string, variables: object = {}, object = false, cache = false, classification?: Classification | boolean): Promise<any> {
      let payload = {
          prompt_name: prompt_name,
          variables: variables
      };

      if (this.apiKey === null) {
          throw new Error("API_KEY is not set");
      }

      let headers = {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + this.apiKey
      };

      try {
          let response: any;

          if (cache) {
              response = await this.cachedCall(JSON.stringify(payload), JSON.stringify(headers));
          } else {
              response = await axios.post(`${this.serviceUrl}/api/generate`, payload, { headers: headers });
          }

          let message = response.data['message'];

          let generated_string: string;
          if (typeof message === 'string') {
              generated_string = message;
          } else if ('content' in message) {
              generated_string = message['content'];
          } else {
              throw new Error("Failed to generate output");
          }

          if (object) {
              return this.convertToObject(generated_string);
          }

          let default_classification: Classification = {
              "true": ["yes", "true", "1"],
              "false": ["no", "false", "0"]
          };

          if (classification) {
              if (classification === true) {
                  classification = default_classification;
              }

              for (let key in classification) {
                  for (let value of classification[key]) {
                      if (generated_string.trim().toLowerCase().includes(value)) {
                          return key;
                      }
                  }
              }
              return null;
          }

          return generated_string;

      } catch (e:any) {
          if (axios.isAxiosError(e)) {
              throw new Error(`Failed to connect: ${e.message}`);
          } else {
              throw new Error(`An error occurred: ${e.message}`);
          }
      }
  }
}