// Wix page code for the private clinician HCL-32 dashboard.
// Expected element: HTML component #hcl32Dashboard.
// Restrict the Wix page itself to authorized clinicians only.
import { getHcl32Assessments } from 'backend/hcl32-dashboard.web';

$w.onReady(() => {
  $w('#hcl32Dashboard').onMessage(async event => {
    if (event.data?.type !== 'HCL32_DASHBOARD_REQUEST') return;
    try {
      const items = await getHcl32Assessments();
      $w('#hcl32Dashboard').postMessage({ type: 'HCL32_DASHBOARD_DATA', items });
    } catch (error) {
      console.error('HCL-32 dashboard load failed', error);
      $w('#hcl32Dashboard').postMessage({ type: 'HCL32_DASHBOARD_DATA', items: [], error: true });
    }
  });
});

