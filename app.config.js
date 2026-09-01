const variant = process.env.APP_VARIANT || "development";

const editions = {
  development: {
    name: "ShopWithEzz (Dev)",
    androidPackage: "com.lalli61.shopwithezz.dev",
    iosBundleIdentifier: "com.lalli61.shopwithezz.dev",
    scheme: "shopwithezz-dev",
    edition: "development"
  },
  trial: {
    name: "ShopWithEzz Trial",
    androidPackage: "com.lalli61.shopwithezz.trial",
    iosBundleIdentifier: "com.lalli61.shopwithezz.trial",
    scheme: "shopwithezz-trial",
    edition: "trial"
  },
  family: {
    name: "ShopWithEzz Family",
    androidPackage: "com.lalli61.shopwithezz.family",
    iosBundleIdentifier: "com.lalli61.shopwithezz.family",
    scheme: "shopwithezz",
    edition: "family"
  },
  google: {
    name: "ShopWithEzz",
    androidPackage: "com.lalli61.shopwithezz",
    iosBundleIdentifier: "com.lalli61.shopwithezz",
    scheme: "shopwithezz",
    edition: "google"
  }
};

const selected = editions[variant] || editions.development;

export default ({config}) => ({
  ...config,
  name: selected.name,
  scheme: selected.scheme,
  android: {...config.android,package: selected.androidPackage},
  ios: {...config.ios,bundleIdentifier: selected.iosBundleIdentifier},
  extra: {...config.extra,appEdition: selected.edition}
});
