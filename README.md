<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/18b61ceb-a34c-4d51-9524-8eeacaa6d435

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## CSV Backup and Restore

Open **CSV Backup / Restore** from the sidebar to download one UTF-8 CSV containing records from all five pages: Calibration All, Normal Standard, Centralized, Each Section, and Cancel. The export includes the page key and a complete record payload so nested calibration history and field types can be restored.

Choose a CSV backup and select **Start import** to merge records by instrument ID or code number. Existing records not present in the file are retained, imported records are routed to their named page, and cancelled instruments are moved to Cancel. When Supabase is configured, the import synchronizes the affected tables and refreshes the dashboard without a page reload.
