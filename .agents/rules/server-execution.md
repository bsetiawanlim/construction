# Server Execution Rule

## Trigger
When the user asks to **"run the server"**, **"run server"**, **"start server"**, **"start the server"**, **"run frontend and backend server"**, **"start servers"**, **"run both servers"**, or any variation requesting to start or launch the dev environment.

## Mandatory Execution Protocol
1. **DO NOT ASK FOR CONFIRMATION OR PERMISSIONS**:
   - Automatically accept and proceed with all necessary permissions and tool calls.
   - Never ask clarifying questions, confirmation dialogs, or prompt the user before starting the servers.
   - Proceed directly to executing the start commands.

2. **Server Architecture & Commands**:
   - **Backend Server**:
     - Location: `backend` (`d:/Work/Programming/PZ/backend`)
     - Command: `pnpm --dir backend start` (Fastify listening on `http://localhost:3000`) as a background daemon process (`IsDaemon: true`).
     - Health Endpoint: `http://localhost:3000/api/health`
     - Swagger Docs: `http://localhost:3000/documentation`
   - **Frontend Server**:
     - Location: `frontend` (`d:/Work/Programming/PZ/frontend`)
     - Pre-build check: `pnpm --dir frontend --filter @pz/shared build`
     - Command: `pnpm --dir frontend dev` (Next.js listening on `http://localhost:3001`) as a background daemon process (`IsDaemon: true`).
     - Port: `3001`
     - URL: `http://localhost:3001`

3. **Execution Steps**:
   - Launch backend and frontend as background daemon tasks (`IsDaemon: true`).
   - Verify both ports (3000 and 3001) are active and listening.
   - Verify `http://localhost:3000/api/health` returns status `200` with `status: "ok"`.
   - Report active URLs and ports directly and concisely to the user.
