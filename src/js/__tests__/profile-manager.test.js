/** @jest-environment jsdom */
import '../main.js';

describe('ProfileManager basic flows', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="save-profile">Save Profile</button>
      <button id="load-profile">Load Profile</button>
      <div id="profiles-container"></div>
      <div id="profile-modal" class="modal">
        <div class="modal-body"></div>
        <button id="modal-save">Save</button>
      </div>
      <div id="tak-config-tab" class="tab-pane active"></div>
      <form id="tak-config-form" class="tak-form">
        <input id="tak-host" value="tak.example.com" />
        <input id="tak-username" value="demo" />
        <input id="tak-token" value="secret" />
      </form>
    `;
    localStorage.clear();

    // Initialize modules used by ProfileManager
    if (window.ProfileManager && window.ProfileManager.init) {
      window.ProfileManager.init();
    }
  });

  test('saves a profile into localStorage', () => {
    // Fake modal inputs
    const name = document.createElement('input');
    name.id = 'profile-name';
    name.value = 'Unit Test Profile';
    document.body.appendChild(name);

    const desc = document.createElement('textarea');
    desc.id = 'profile-description';
    desc.value = 'desc';
    document.body.appendChild(desc);

    // Save
    window.ProfileManager.saveProfile();

    const stored = JSON.parse(localStorage.getItem('tak-profiles') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('Unit Test Profile');
  });
});
