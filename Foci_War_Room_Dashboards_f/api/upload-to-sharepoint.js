export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileBase64, category, recordType, recordName } = req.body;

    if (!fileName || !fileBase64 || !category || !recordType || !recordName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const TENANT_ID = process.env.SHAREPOINT_TENANT_ID;
    const CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID;
    const CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET;
    const SITE_URL = 'https://m365focigroup.sharepoint.com';

    // Step 1 — Get access token from Microsoft
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default'
        })
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Token error:', tokenData);
      return res.status(401).json({ error: 'Failed to get access token', detail: tokenData });
    }

    const token = tokenData.access_token;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Step 2 — Get SharePoint site ID
    const siteRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/m365focigroup.sharepoint.com:/`,
      { headers }
    );
    const siteData = await siteRes.json();
    if (!siteData.id) {
      return res.status(500).json({ error: 'Could not find SharePoint site', detail: siteData });
    }
    const siteId = siteData.id;

    // Step 3 — Get default drive ID
    const driveRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive`,
      { headers }
    );
    const driveData = await driveRes.json();
    if (!driveData.id) {
      return res.status(500).json({ error: 'Could not find drive', detail: driveData });
    }
    const driveId = driveData.id;

    // Step 4 — Build folder path
    const safeName = recordName.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const safeCategory = category.charAt(0).toUpperCase() + category.slice(1);
    const folderType = recordType === 'bid' ? 'Bids' : 'Contacts';
    const folderPath = `Foci War Room/${folderType}/${safeName}/${safeCategory}`;

    // Step 5 — Create folders (will not fail if they exist)
    const folders = ['Foci War Room', `Foci War Room/${folderType}`, `Foci War Room/${folderType}/${safeName}`, folderPath];
    for (const folder of folders) {
      const parts = folder.split('/');
      const folderName = parts.pop();
      const parentPath = parts.join('/');
      const parentEndpoint = parentPath
        ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${parentPath}:/children`
        : `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;

      await fetch(parentEndpoint, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'ignore'
        })
      });
    }

    // Step 6 — Upload the file
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
      return res.status(500).json({ error: 'File upload failed', detail: uploadData });
    }

    // Step 7 — Create a sharing link
    const linkRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${uploadData.id}/createLink`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'view', scope: 'organization' })
      }
    );
    const linkData = await linkRes.json();
    const shareUrl = linkData.link?.webUrl || uploadData.webUrl;

    return res.status(200).json({
      success: true,
      url: shareUrl,
      fileName,
      folderPath
    });

  } catch (err) {
    console.error('SharePoint upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
