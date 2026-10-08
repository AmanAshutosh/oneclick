// Centralised access to environment variables with sane defaults.
export const env = {
  get siteUrl() {
    return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  get siteName() {
    return process.env.SITE_NAME || "OneClick";
  },
  get siteDescription() {
    return process.env.SITE_DESCRIPTION || "A modern publication.";
  },
  get uploadDir() {
    return process.env.UPLOAD_DIR || "./uploads";
  },
  get maxUploadBytes() {
    return Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024;
  },
};
