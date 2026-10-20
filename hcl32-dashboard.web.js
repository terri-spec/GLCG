// Backend web method for the private HCL-32 clinician dashboard.
// Add this file to Wix Studio's Backend section as hcl32-dashboard.web.js.
import { Permissions, webMethod } from '@wix/web-methods';
import wixData from 'wix-data';

export const getHcl32Assessments = webMethod(Permissions.Admin, async () => {
  let result = await wixData
    .query('hcl32Assessments')
    .descending('submittedAt')
    .limit(1000)
    .find({ suppressAuth: true });

  const items = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    items.push(...result.items);
  }

  return items;
});
