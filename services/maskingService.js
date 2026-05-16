module.exports = {
  maskName: (v) => (v ? `${v[0]}**` : v),
  maskCompany: (v) => (v ? `${v.slice(0, 2)}***` : v),
  maskAccount: (v) => String(v || '').replace(/\d(?=\d{4})/g, '*')
};
