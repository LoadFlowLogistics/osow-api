import { getUserFromAuthHeader } from '@/lib/auth';
import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: 'Missing state code' });

  const user = getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const stateCode = code.toUpperCase();

  if (!user.allowedStates.includes(stateCode)) {
    return res.status(403).json({ error: `You don't have access to ${stateCode}` });
  }

  try {
    const filePath = path.resolve(process.cwd(), 'data/states', `${code.toLowerCase()}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(404).json({ error: `State ${code.toUpperCase()} not found` });
  }
}
