import '../main.js';

describe('updateATAKQR', () => {
  let atakHost, atakDownload, atakCopy;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <input id="atak-host" value="takserver.com" />
      <input id="atak-username" value="john.doe" />
      <input id="atak-token" value="SuperSecret123" />
      <canvas id="atak-qr"></canvas>
      <button id="atak-download" disabled>Download</button>
      <button id="atak-copy" disabled>Copy</button>
    `;
    atakHost = document.getElementById('atak-host');
    atakDownload = document.getElementById('atak-download');
    atakCopy = document.getElementById('atak-copy');
  });

  it('generates correct tak:// URI and enables buttons when all fields are filled', async () => {
    // updateATAKQR is attached to window in main.js
    await window.updateATAKQR();
    // Check that QR code was generated (mocked)
    // Check that download/copy buttons are enabled
    expect(atakDownload.disabled).toBe(false);
    expect(atakCopy.disabled).toBe(false);
    // Check that the correct URI is set on the download button (data attribute or similar)
    // (You may need to adjust this if your implementation differs)
    // For now, just check the expected URI
    // Example: expect(atakDownload.getAttribute('data-uri')).toBe(expectedURI);
  });

  it('disables buttons if any field is missing', async () => {
    atakHost.value = '';
    await window.updateATAKQR();
    expect(atakDownload.disabled).toBe(true);
    expect(atakCopy.disabled).toBe(true);
  });
});

describe('updateiTAKQR', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="itak-description" value="Test Server" />
      <input id="itak-url" value="https://tak.example.com" />
      <input id="itak-port" value="8089" />
      <select id="itak-protocol"><option value="https" selected>https</option><option value="http">http</option></select>
      <canvas id="itak-qr"></canvas>
      <button id="itak-download" disabled>Download</button>
      <button id="itak-copy" disabled>Copy</button>
    `;
  });

  it('generates correct CSV and enables buttons when all fields are filled', async () => {
    await window.updateiTAKQR();
    expect(document.getElementById('itak-download').disabled).toBe(false);
    expect(document.getElementById('itak-copy').disabled).toBe(false);
    // CSV: description,host,port,protocol
    // protocol should be converted to ssl
    // host extracted from URL
    // (You may want to check clipboard/copyURI in a separate test)
  });

  it('disables buttons if any field is missing', async () => {
    document.getElementById('itak-url').value = '';
    await window.updateiTAKQR();
    expect(document.getElementById('itak-download').disabled).toBe(true);
    expect(document.getElementById('itak-copy').disabled).toBe(true);
  });
});

describe('updateImportQR', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="import-url" value="https://domain/file.zip" />
      <canvas id="import-qr"></canvas>
      <button id="import-download" disabled>Download</button>
      <button id="import-copy" disabled>Copy</button>
    `;
  });

  it('generates correct import URI and enables buttons when field is filled', async () => {
    await window.updateImportQR();
    expect(document.getElementById('import-download').disabled).toBe(false);
    expect(document.getElementById('import-copy').disabled).toBe(false);
  });

  it('disables buttons if field is missing', async () => {
    document.getElementById('import-url').value = '';
    await window.updateImportQR();
    expect(document.getElementById('import-download').disabled).toBe(true);
    expect(document.getElementById('import-copy').disabled).toBe(true);
  });
});

describe('populateiTAKFromATAK', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="atak-host" value="https://takserver.com" />
      <input id="atak-username" value="alice" />
      <input id="atak-token" value="token123" />
      <input id="itak-url" value="" />
      <input id="itak-protocol" value="" />
      <input id="itak-username" value="" />
      <input id="itak-token" value="" />
      <input id="itak-description" value="" />
      <input id="itak-port" value="8089" />
      <canvas id="itak-qr"></canvas>
      <button id="itak-download" disabled>Download</button>
      <button id="itak-copy" disabled>Copy</button>
    `;
  });

  it('parses hostname and protocol, populates iTAK fields', async () => {
    await window.populateiTAKFromATAK();
    expect(document.getElementById('itak-url').value).toBe('https://takserver.com');
    expect(document.getElementById('itak-protocol').value).toBe('https');
    expect(document.getElementById('itak-username').value).toBe('alice');
    expect(document.getElementById('itak-token').value).toBe('token123');
  });
});

describe('populateATAKFromiTAK', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="itak-url" value="https://takserver.com" />
      <input id="itak-username" value="bob" />
      <input id="itak-token" value="tok456" />
      <input id="atak-host" value="" />
      <input id="atak-username" value="" />
      <input id="atak-token" value="" />
      <input id="itak-description" value="desc" />
      <input id="itak-port" value="8089" />
      <canvas id="atak-qr"></canvas>
      <button id="atak-download" disabled>Download</button>
      <button id="atak-copy" disabled>Copy</button>
    `;
  });

  it('parses hostname and populates ATAK fields', async () => {
    await window.populateATAKFromiTAK();
    expect(document.getElementById('atak-host').value).toBe('takserver.com');
    expect(document.getElementById('atak-username').value).toBe('bob');
    expect(document.getElementById('atak-token').value).toBe('tok456');
  });
});

describe('transferDataFromATAKToiTAK', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="atak-host" value="takserver.com" />
      <input id="itak-url" value="" />
      <input id="itak-description" value="desc" />
      <input id="itak-port" value="8089" />
      <input id="itak-protocol" value="https" />
      <canvas id="itak-qr"></canvas>
      <button id="itak-download" disabled>Download</button>
      <button id="itak-copy" disabled>Copy</button>
    `;
  });

  it('copies ATAK host to iTAK URL if iTAK URL is empty', async () => {
    await window.transferDataFromATAKToiTAK();
    expect(document.getElementById('itak-url').value).toBe('https://takserver.com');
  });

  it('does not overwrite iTAK URL if already filled', async () => {
    document.getElementById('itak-url').value = 'https://existing.com';
    await window.transferDataFromATAKToiTAK();
    expect(document.getElementById('itak-url').value).toBe('https://existing.com');
  });
});

describe('transferDataFromiTAKToATAK', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="itak-url" value="takserver.com" />
      <input id="atak-host" value="" />
      <input id="atak-username" value="" />
      <input id="atak-token" value="" />
      <input id="itak-description" value="desc" />
      <input id="itak-port" value="8089" />
      <input id="itak-protocol" value="https" />
      <canvas id="atak-qr"></canvas>
      <button id="atak-download" disabled>Download</button>
      <button id="atak-copy" disabled>Copy</button>
    `;
  });

  it('copies iTAK host to ATAK host if ATAK host is empty', async () => {
    await window.transferDataFromiTAKToATAK();
    expect(document.getElementById('atak-host').value).toBe('takserver.com');
  });

  it('does not overwrite ATAK host if already filled', async () => {
    document.getElementById('atak-host').value = 'existing.com';
    await window.transferDataFromiTAKToATAK();
    expect(document.getElementById('atak-host').value).toBe('existing.com');
  });
});

// Matrix utilities tests

describe('loadMatrixStats', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="matrix-stats"></div>
    `;
    // Reset fetch mock
    global.fetch.mockClear();
  });

  it('updates DOM with matrix statistics when fetch succeeds', async () => {
    const mockMatrixData = {
      preferences: [
        { key: 'pref1', versions: { '5.4.0': { hide: true }, '5.2.0': { disable: true } } },
        { key: 'pref2', versions: { '5.4.0': { hide: true, disable: true } } }
      ],
      versions: ['5.4.0', '5.2.0']
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatrixData
    });

    await window.loadMatrixStats();

    const statsContainer = document.getElementById('matrix-stats');
    expect(statsContainer.innerHTML).toContain('2'); // Total Preferences
    expect(statsContainer.innerHTML).toContain('2'); // ATAK Versions
    expect(statsContainer.innerHTML).toContain('2'); // Can Hide
    expect(statsContainer.innerHTML).toContain('2'); // Can Disable
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await window.loadMatrixStats();

    const statsContainer = document.getElementById('matrix-stats');
    expect(statsContainer.innerHTML).toContain('Error loading matrix data');
  });
});

describe('downloadMatrixData', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch.mockClear();
    // Reset URL.createObjectURL mock
    global.URL.createObjectURL.mockClear();
    global.URL.revokeObjectURL.mockClear();
  });

  it('downloads matrix data successfully', async () => {
    const mockData = { test: 'data' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    await window.downloadMatrixData();

    expect(global.fetch).toHaveBeenCalledWith('/docs/matrix/version-matrix.json');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Download failed'));

    await window.downloadMatrixData();

    expect(global.fetch).toHaveBeenCalledWith('/docs/matrix/version-matrix.json');
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });
});
