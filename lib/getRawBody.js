// /lib/getRawBody.js
import getRawBody from 'raw-body';

export async function getRawBodyFromRequest(req) {
    const buf = await getRawBody(req);
    return buf.toString('utf8');
}