function calculateKpis({ issues, supportRequests, closingStatus }) {
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;
  const totalSupport = supportRequests.length;
  return {
    issueResolutionRate: totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
    totalSupport,
    delayedCompanies: closingStatus.companies.filter(c => c.isDelayed).length
  };
}
module.exports = { createMetricsService: () => ({ calculateKpis }) };
