const fs = require('fs');
const path = require('path');

class MockErpAdapter {
  async getClosingStatus() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/erp-close-status.json'))).closingStatus; }
  async getClosingHistory(companyCode, months) { return { companyCode, months, history: [] }; }
  async getClosingIssues() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/erp-close-status.json'))).issues; }
  async getModuleClosingStatus() { return JSON.parse(fs.readFileSync(path.join(__dirname, '../samples/erp-close-status.json'))).moduleStatuses; }
}
class ErpRfcAdapter extends MockErpAdapter {}
class ErpRestApiAdapter extends MockErpAdapter {}

function createErpService() {
  const mode = (process.env.ERP_MODE || 'MOCK').toUpperCase();
  const adapter = mode === 'RFC' ? new ErpRfcAdapter() : mode === 'REST' ? new ErpRestApiAdapter() : new MockErpAdapter();
  return adapter;
}

module.exports = { createErpService };
