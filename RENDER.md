# Deploy to Render

The React frontend and Express API run together as **one Render Web Service**. Requests use the same HTTPS origin, so there is no separate frontend URL or CORS configuration. MongoDB stays in Atlas.

1. Push this project to a private GitHub repository. Keep `Backend/.env` and `Backend/.runtime` out of Git (already ignored).
2. In Render, choose **New → Blueprint**, connect that repository, and use the root `render.yaml`.
3. Enter **MONGODB_URL** using the same Atlas connection that already contains your committee and administrator. The app uses its `committee` database.
4. Deploy. Render builds the React app and starts Express. Open the provided HTTPS URL.

The Blueprint generates `JWT_SECRET` automatically and sets production mode. Your administrator name, password and records remain in MongoDB. They are not copied into the deployment source and are not reset on deployment. Do not deploy against an empty database: initialize its administrator locally first. No persistent Render disk is required.

For manual Web Service setup, leave Root Directory empty; set Build Command to `npm ci --include=dev && npm run build`, Start Command to `npm start`, and Health Check Path to `/health`. Set `NODE_ENV=production`, `MONGODB_URL` to your Atlas URL, and generate a private random `JWT_SECRET` of at least 32 characters in Render. Port comes automatically from Render.

In Atlas Network Access, allow the outbound IP ranges shown for your Render service. Ensure its database user can create collections/indexes and read/write the `committee` database. Use Atlas or a MongoDB replica set because financial writes require transactions.

Deployment readiness: the app serves `frontend/dist`, supports SPA refreshes, trusts Render's HTTPS proxy for secure cookies and rate limiting, uses Render's port, and closes MongoDB connections during shutdown. `/health` reports healthy only while MongoDB is connected. Production secrets never depend on Render's temporary filesystem.

Render's free web services can sleep when idle; choose the service plan that matches your availability needs. This repository is prepared for deployment; no Render service has been created by this task.

References: [Render Node/Express deployment](https://render.com/docs/deploy-node-express-app), [Blueprint reference](https://render.com/docs/blueprint-spec), [Web services and ports](https://render.com/docs/web-services), [Environment variables](https://render.com/docs/configure-environment-variables).
