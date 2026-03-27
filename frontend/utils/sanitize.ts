export const sanitizeNumber = (value: any): number => {
  const num = parseFloat(String(value));
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
};

export const sanitizeString = (value: any, maxLength: number = 500): string => {
  const str = String(value).trim();
  
  if (str.length > maxLength) {
    console.warn(`String truncated from ${str.length} to ${maxLength} characters`);
    return str.substring(0, maxLength);
  }

  return str;
};

export const sanitizeJSON = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  
  if (typeof obj === 'number') return sanitizeNumber(obj);
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'boolean') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeJSON(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

export const validateCoordinates = (lat: number, lon: number): void => {
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
  }
  if (lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
  }
};

export const validateSoilData = (data: any): void => {
  const ranges: Record<string, [number, number]> = {
    N: [0, 140],
    P: [5, 145],
    K: [5, 205],
    temperature: [8, 45],
    humidity: [10, 100],
    ph: [3.5, 10],
    rainfall: [0, 1500],
  };

  for (const [field, [min, max]] of Object.entries(ranges)) {
    const value = data[field];
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${field} must be a valid number`);
    }
    if (value < min || value > max) {
      throw new Error(`${field} ${value} is outside valid range [${min}, ${max}]`);
    }
  }
};

export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
};
