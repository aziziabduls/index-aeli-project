import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "INDEX-AELI CMS",
  version: packageJson.version,
  copyright: `© ${currentYear}, INDEX-AELI.`,
  meta: {
    title: "INDEX-AELI CMS - Content Management System",
    description:
      "INDEX-AELI CMS is a comprehensive content management system for managing destinations, attractions, programs, and providers.",
  },
};
