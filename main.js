require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { createErpService } = require('./services/erpService');
const { createChatService } = require('./services/chatService');
const { createLlmService } = require('./services/llmService');
const { createTemplateService } = require('./services/templateService');
const { createEmailService } = require('./services/emailService');
const { createMetricsService } = require('./services/metricsService');

const erpService = createErpService();
const chatService = createChatService();
const llmService = createLlmService();
const templateService = createTemplateService();
const emailService = createEmailService();
const metricsService = createMetricsService();

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('dashboard:generate', async (_, payload) => {
    const { closingMonth } = payload;
    const closingStatus = await erpService.getClosingStatus(closingMonth);
    const issues = await erpService.getClosingIssues(closingMonth);
    const moduleStatuses = await erpService.getModuleClosingStatus(closingMonth);
    const chatMessages = await chatService.fetchAndPrepareMessages({ closingMonth });

    const supportRequests = await llmService.analyzeChat({ closingMonth, chatMessages });
    const kpis = metricsService.calculateKpis({ closingStatus, issues, supportRequests });
    const dashboardSummary = await llmService.summarizeDashboard({ closingStatus, issues, moduleStatuses, supportRequests, kpis });

    const dashboardInput = { closingMonth, closingStatus, issues, moduleStatuses, supportRequests, kpis, dashboardSummary };
    const html = templateService.renderDashboard(dashboardInput);
    const file = path.join(__dirname, 'output', `dashboard-${closingMonth}.html`);
    fs.writeFileSync(file, html, 'utf-8');

    return { ok: true, html, file, dashboardInput };
  });

  ipcMain.handle('email:send', async (_, payload) => emailService.sendDashboardEmail(payload));
});
