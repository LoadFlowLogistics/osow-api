import { getUserFromAuthHeader } from '@/lib/auth';
import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { permit_type, escort_width_gt } = req.query;
  const dirPath = path.resolve(process.cwd(), 'data/states');

  try {
    const files = await fs.readdir(dirPath);

    const matchedStates = [];

    for (const file of files) {
      const code = file.replace('.json', '').toUpperCase();
      if (!user.allowedStates.includes(code)) continue;

      const filePath = path.join(dirPath, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const state = JSON.parse(raw);

      let match = true;

      // Permit type filter
      if (permit_type) {
        if (!state.permit_types || !state.permit_types.includes(permit_type)) {
          match = false;
        }
      }

      // Escort width filter
      if (escort_width_gt) {
        const reqText = state.escort_requirements?.width || '';
        const numeric = parseFloat(escort_width_gt);
        if (!reqText.includes('>') || parseFloat(reqText.match(/(\d+\.?\d*)/g)?.[0] || 0) < numeric) {
          match = false;
        }
      }

      if (match) {
        matchedStates.push({
          code,
          state: state.state,
          permit_types: state.permit_types,
          escort_requirements: state.escort_requirements || {}
        });
      }
    }

    res.status(200).json(matchedStates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to run query' });
  }
}
