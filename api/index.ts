import { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer as createVercelServer } from '@vercel/node';
import expressApp from '../server/expressApp';

export default createVercelServer(expressApp);
