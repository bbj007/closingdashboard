const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

function createLlmService() {
  const ajv = new Ajv();
  const supportSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/supportRequests.schema.json')));
  const dashboardSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '../schemas/dashboardSummary.schema.json')));
  const v1 = ajv.compile(supportSchema); const v2 = ajv.compile(dashboardSchema);

  return {
    async analyzeChat() {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/support-requests.json')));
      if (!v1(data)) throw new Error(`Support schema invalid: ${JSON.stringify(v1.errors)}`);
      return data.supportRequests;
    },
    async summarizeDashboard() {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/dashboard-summary.json')));
      if (!v2(data)) throw new Error(`Dashboard schema invalid: ${JSON.stringify(v2.errors)}`);
      return data;
    }
  };
}
module.exports = { createLlmService };
