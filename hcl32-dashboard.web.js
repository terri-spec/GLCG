// Backend web method for the private HCL-32 clinician dashboard.
// Add this file to Wix Studio's Backend section as hcl32-dashboard.web.js.
import { Permissions, webMethod } from '@wix/web-methods';
import { members } from '@wix/members';
import wixData from 'wix-data';

const AUTHORIZED_CLINICIAN_MEMBER_IDS = new Set([
  'ad651237-4197-4634-aa7a-9d1c87c1d6d5',
  'fad4047b-8d05-47fe-97c8-e698432a50fd',
]);

export const getHcl32Assessments = webMethod(Permissions.SiteMember, async () => {
  const currentMember = await members.getCurrentMember();
  if (!currentMember || !AUTHORIZED_CLINICIAN_MEMBER_IDS.has(currentMember._id)) {
    throw new Error('Not authorized to view HCL-32 assessments.');
  }

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
