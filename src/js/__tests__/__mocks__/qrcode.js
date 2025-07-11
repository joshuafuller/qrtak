module.exports = {
  toCanvas: jest.fn().mockResolvedValue(),
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code')
};
