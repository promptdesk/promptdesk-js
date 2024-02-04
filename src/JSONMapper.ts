interface Condition {
    when: {
        field: string;
        equals: any;
    };
    transformTo: any;
}

interface TransformationRules {
    conditions?: Condition[];
    text?: string[];
}

interface Condition {
    sourceField: string;
    check: string;
    value?: any;
}

export class JSONMapper {
    
    //create empty constructor
    constructor() {}

    isInteger(s: string): boolean {
        if (s.startsWith('-')) {
            return !isNaN(Number(s.substring(1)));
        }
        return !isNaN(Number(s));
    }

    getFromDict(dataDict: any, mapPath: string | null, defaultValue: any): any {
        if (mapPath === null) {
            return defaultValue;
        }
        const keys = mapPath.split('.');
        const collectedValues: any[] = [];

        const recurse = (data: any, keys: string[]): any => {
            if (!keys.length) {
                return data;
            }
            const key = keys[0];
            if (key === "*") {
                if (!Array.isArray(data)) {
                    return defaultValue;
                }
                for (const item of data) {
                    const result = recurse(item, keys.slice(1));
                    if (result !== null) {
                        if (Array.isArray(result)) {
                            collectedValues.push(...result);
                        } else {
                            collectedValues.push(result);
                        }
                    }
                }
            } else if (this.isInteger(key)) {
                let parsedKey = parseInt(key);
                if (parsedKey >= 0 && Array.isArray(data) && data.length > parsedKey) {
                    return recurse(data[parsedKey], keys.slice(1));
                } else if (parsedKey < 0 && Array.isArray(data) && -parsedKey <= data.length) {
                    return recurse(data[data.length + parsedKey], keys.slice(1));
                } else {
                    return defaultValue;
                }
            } else {
                if (data && typeof data === 'object' && key in data) {
                    return recurse(data[key], keys.slice(1));
                } else {
                    return defaultValue;
                }
            }
            return collectedValues;
        };

        const result = recurse(dataDict, keys);
        return collectedValues.length ? collectedValues : result;
    }

    applySubrules(sourceItem: any, subrules: any[]): any {
        let tempObject = {};
        for (let subrule of subrules) {
            let sourceValue = this.getFromDict(sourceItem, subrule['sourceField'], subrule['default'] || null);
            if (sourceValue === null) {
                sourceValue = subrule['default'];
            }
            // Check for transformation rule
            if (subrule.hasOwnProperty("transformation")) {
                sourceValue = this.transformValue(sourceValue, subrule["transformation"]);
            }
            this.setInDict(tempObject, subrule['targetField'], sourceValue, subrule['appendTo'] || false, subrule['prependTo'] || false);
        }
        return tempObject;
    }

    setInDict(dataDict: any, mapPath: string, value: any, appendTo: boolean = false, prependTo: boolean = false): void {
        const keys = mapPath.split('.');
        for (let i = 0; i < keys.length - 1; i++) {
            let key: string | number = keys[i];
            if (this.isInteger(key)) {
                key = parseInt(key);
                while (key >= dataDict.length) {
                    dataDict.push({});
                }
                dataDict = dataDict[key];
            } else {
                if (i < keys.length - 2 && !isNaN(parseInt(keys[i + 1]))) {
                    // Next key is a digit, ensure a list
                    dataDict = dataDict[key] || (dataDict[key] = []);
                } else {
                    dataDict = dataDict[key] || (dataDict[key] = {});
                }
            }
        }

        if (appendTo || prependTo) {
            const lastKey = keys[keys.length - 1];
            // Ensure the target is a list
            if (!dataDict[lastKey] || !Array.isArray(dataDict[lastKey])) {
                dataDict[lastKey] = [];
            }
            if (appendTo) {
                dataDict[lastKey].push(value);
            } else if (prependTo) {
                dataDict[lastKey].unshift(value);
            }
        } else {
            // Handle the last key for direct set
            const lastKey = keys[keys.length - 1];
            if (this.isInteger(lastKey)) {
                let lastKeyIndex = parseInt(lastKey);
                while (lastKeyIndex >= dataDict.length) {
                    dataDict.push(null);
                }
                dataDict[lastKeyIndex] = value;
            } else {
                dataDict[lastKey] = value;
            }
        }
    }

    transformValue(value: any, transformationRules: TransformationRules): any {
        const conditions = transformationRules.conditions || [];
        for (let condition of conditions) {
            if (condition.when.field === "value") {
                if (value === condition.when.equals) {
                    return condition.transformTo;
                }
            }
        }

        // keep for last
        const textConditions = transformationRules.text || [];
        for (let condition of textConditions) {
            if (condition === "uppercase") {
                return value.toUpperCase();
            } else if (condition === "lowercase") {
                return value.toLowerCase();
            } else if (condition === "strip") {
                return value.trim();
            }
        }

        return value;  // Return original value if no conditions met
    }

    checkConditions(conditions: Condition[], sourceJson: any, rule: any): boolean {
        for (let condition of conditions) {
            let sourceValue = this.getFromDict(sourceJson, condition['sourceField'], null);
            if (condition['check'] === 'equals') {
                return sourceValue === condition['value'];
            } else if (condition['check'] === 'not-equals') {
                return sourceValue !== condition['value'];
            } else if (condition['check'] === 'exists') {
                return sourceValue !== null && sourceValue !== undefined;
            } else {
                throw new Error(`Unsupported check: ${rule['check']}`);
            }
        }
        return false; // return false if no conditions are met
    }

    applyMapping(sourceJson: any, mappingRules: any[]): any {
        let targetJson: any = {};
        let tempStorage: { [key: string]: any } = {};

        // Process rules to either directly set values or prepare them for grouped appending
        for (let rule of mappingRules) {
            // Process non-array mappings as before
            let sourceValue = this.getFromDict(sourceJson, rule['sourceField'], rule['default'] || null);
            if ("conditions" in rule) {
                let isConditionMet = this.checkConditions(rule["conditions"], sourceJson, rule);
                if (!isConditionMet) {
                    continue;
                }
            }
            if (rule['action'] === 'mapArray' && 'subRules' in rule) {
                // Handle nested array mapping
                let sourceArray = this.getFromDict(sourceJson, rule['sourceField'], rule['default'] || null);
                if (Array.isArray(sourceArray)) {
                    let mappedArray = sourceArray.map(item => this.applySubrules(item, rule['subRules']));
                    this.setInDict(targetJson, rule['targetField'], mappedArray, rule['appendTo'] || false, rule['prependTo'] || false);
                }
            } else {
                if ("transformation" in rule) {
                    sourceValue = this.transformValue(sourceValue, rule["transformation"]);
                }
                if ('groupId' in rule) {
                    if (!(rule['groupId'] in tempStorage)) {
                        tempStorage[rule['groupId']] = {};
                    }
                    tempStorage[rule['groupId']][rule['targetField']] = sourceValue;
                } else {
                    if (!('targetField' in rule)) {
                        return sourceValue;
                    }
                    this.setInDict(targetJson, rule['targetField'], sourceValue, rule['appendTo'] || false);
                }
            }
        }

        // Append/prepend grouped items from temporary storage to the target structure
        for (let groupId in tempStorage) {
            let data = tempStorage[groupId];
            let appendTarget = null;
            let prependTarget = null;
            for (let rule of mappingRules) {
                if (rule['groupId'] === groupId) {
                    if ('appendTo' in rule) {
                        appendTarget = rule['appendTo'];
                    } else if ('prependTo' in rule) {
                        prependTarget = rule['prependTo'];
                    }
                    break;
                }
            }
            if (appendTarget) {
                this.setInDict(targetJson, appendTarget, data, true);
            } else if (prependTarget) {
                this.setInDict(targetJson, prependTarget, data, false, true);
            }
        }

        return targetJson;
    }

}