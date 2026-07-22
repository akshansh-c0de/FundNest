import { UAParser } from 'ua-parser-js';

const parseSessionDetails = (req) => {
    const uaHeader = req.headers['user-agent'] || '';
    const parser = new UAParser(uaHeader);
    const result = parser.getResult();

    const deviceVendor = result.device.vendor || '';
    const deviceModel = result.device.model || '';
    const deviceType = result.device.type || '';
    
    let device = 'Desktop';
    if (deviceVendor || deviceModel || deviceType) {
        device = `${deviceVendor} ${deviceModel} (${deviceType})`.trim();
    }

    const browser = `${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`.trim();
    
    // Support behind proxy IPs as well
    const ipAddress = 
        req.headers['x-forwarded-for']?.split(',')[0].trim() || 
        req.ip || 
        req.socket.remoteAddress || 
        'Unknown IP';

    return { device, browser, ipAddress };
};

export { parseSessionDetails };
