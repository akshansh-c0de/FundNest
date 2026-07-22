import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const generate2faSecret = (email) => {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
        secret,
        label: email,
        issuer: 'FundNest',
    });
    return { secret, otpauthUrl };
};

const generateQrCodeUri = async (otpauthUrl) => {
    try {
        const qrCodeUri = await QRCode.toDataURL(otpauthUrl);
        return qrCodeUri;
    } catch (error) {
        throw new Error('Error generating QR code URI');
    }
};

const verify2faCode = async (token, secret) => {
    try {
        const res = await verify({ token, secret });
        return !!(res && res.valid);
    } catch (error) {
        return false;
    }
};

const generateRecoveryCodes = (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // Generate random 10 character alphanumeric string
        const code = crypto.randomBytes(5).toString('hex');
        codes.push(code);
    }
    return codes;
};

export { generate2faSecret, generateQrCodeUri, verify2faCode, generateRecoveryCodes };
