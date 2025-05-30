import { getUserFromAuthHeader } from '@/lib/auth';
import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  const user = getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const dirPath = path.resolve(process.cwd(), 'data/states');
    const files = await fs.readdir(dirPath);

    const allowedFiles = files.filter((file) => {
      const code = file.replace('.json', '').toUpperCase();
      return user.allowedStates.includes(code);
    });

    const stateList = await Promise.all(
      allowedFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(raw);
        return {
          code: file.replace('.json', '').toUpperCase(),
          name: data.state,
          permit_types: data.permit_types || [],
        };
      })
    );

    res.status(200).json({ states: stateList });
  } catch (err) {
    res.status(500).json({ error: 'Could not load states' });
  }
}
