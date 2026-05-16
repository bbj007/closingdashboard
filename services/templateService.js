const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
function createTemplateService() {
  const src = fs.readFileSync(path.join(__dirname, '../templates/dashboard.hbs'), 'utf-8');
  const template = Handlebars.compile(src);
  return { renderDashboard: (data) => template(data) };
}
module.exports = { createTemplateService };
