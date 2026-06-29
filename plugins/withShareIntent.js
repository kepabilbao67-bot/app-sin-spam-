const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withShareIntent(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];
    if (!app.activity) app.activity = [];

    // Find main activity and add intent filter for text sharing
    const mainActivity = app.activity.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );
    if (mainActivity) {
      if (!mainActivity['intent-filter']) mainActivity['intent-filter'] = [];
      const alreadyHas = mainActivity['intent-filter'].some(
        (f) => f.action?.[0]?.['$']?.['android:name'] === 'android.intent.action.SEND'
      );
      if (!alreadyHas) {
        mainActivity['intent-filter'].push({
          action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
          data: [{ $: { 'android:mimeType': 'text/plain' } }],
        });
      }
    }
    return config;
  });
};
